import AsyncStorage from '@react-native-async-storage/async-storage';

import { arrayMoveMutable } from 'array-move';
import ExpiryMap from 'expiry-map';
import ky from 'ky';
import pDebounce from 'p-debounce';
import pMemoize from 'p-memoize';
import create from 'zustand';

const STORIES_TTL = 10 * 60 * 1000; // 10 mins
const cache = new ExpiryMap(60 * 1000);
const hooks = {
  beforeRequest: [
    (request) => {
      console.log(`🐕 ${request.method} ${request.url}`);
    },
  ],
  beforeRetry: [
    ({ request }) => {
      console.log(`♻️ ${request.method} ${request.url}`);
    },
  ],
};

const API_ROOT = 'https://api.hackerwebapp.com';
const api = ky.create({
  prefixUrl: API_ROOT,
  hooks,
});

const ALGOLIA_API_ROOT = 'https://hn.algolia.com/api/v1';
const algoliaApi = ky.create({
  prefixUrl: ALGOLIA_API_ROOT,
  timeout: false,
  hooks,
});

const OFFICIAL_API_ROOT = `https://hacker-news.firebaseio.com/v0`;
const officialApi = ky.create({
  prefixUrl: OFFICIAL_API_ROOT,
  hooks,
});

function setItem(key, val, ttl) {
  if (!key || !val) return;
  console.log(`💾 SET ${key} ${ttl ? ttl : ''}`);
  return AsyncStorage.setItem(
    key,
    JSON.stringify({
      data: val,
      expire: ttl ? Date.now() + ttl : undefined,
    }),
  );
}

async function updateItem(key, val, ttl) {
  if (!key || !val) return;
  console.log(`💾 UPDATE ${key}`);
  const json = await AsyncStorage.getItem(key);
  if (json) {
    const { expire } = JSON.parse(json);
    return AsyncStorage.setItem(
      key,
      JSON.stringify({
        data: val,
        expire,
      }),
    );
  } else {
    setItem(key, val, ttl);
  }
}

async function getItem(key) {
  if (!key) return;
  console.log(`💾 GET ${key}`);
  const json = await AsyncStorage.getItem(key);
  if (json) {
    const { data, expire } = JSON.parse(json);
    if (expire && expire <= Date.now()) {
      console.log(`💾 REMOVE ${key}`);
      AsyncStorage.removeItem(key);
      return null;
    } else {
      return data;
    }
  }
  return null;
}

async function isExpired(key) {
  if (!key) return;
  const json = await AsyncStorage.getItem(key);
  if (json) {
    const { expire } = JSON.parse(json);
    return expire && expire <= Date.now();
  }
  return true;
}

const useStore = create((set, get) => ({
  lastBackgroundTime: null,
  setLastBackgroundTime: (lastBackgroundTime) => {
    console.log(`🥞 setLastBackgroundTime ${lastBackgroundTime}`);
    set({ lastBackgroundTime });
  },
  updateIsAvailable: false,
  setUpdateIsAvailable: (updateIsAvailable) => {
    console.log(`🥞 setUpdateIsAvailable ${updateIsAvailable}`);
    set({ updateIsAvailable });
  },
  stories: [],
  clearStories: () => set({ stories: [] }),
  fetchStories: async () => {
    console.log(`🥞 fetchStories`);
    let stories = await getItem('stories');
    if (stories?.length) {
      if (get().stories.length) return;
      set({ stories });
    } else {
      const news = await api('news').json();
      stories = news;
      if (stories.length) {
        if (stories[0]?.title) {
          console.log(`🥇 First story: ${stories[0].title}`);
        }
        set({ stories });
        setItem('stories', stories, STORIES_TTL);

        // Delay-load news2
        api('news2')
          .json()
          .then((news2) => {
            stories = [...news, ...news2].filter(
              // https://stackoverflow.com/a/56757215
              (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
            );
            set({ stories });
            setItem('stories', stories, STORIES_TTL);
          })
          .catch(() => {});
      } else {
        throw new Error('Zero stories');
      }
    }
  },
  isStoriesExpired: async () => await isExpired('stories'),
  fetchStory: pDebounce(
    pMemoize(
      async (id) => {
        console.log(`🥞 fetchStory ${id}`);
        const { stories } = get();
        const index = stories.findIndex((s) => s.id === id);
        let story = stories[index];
        const storyFetched = !!story?.comments?.length;
        if (!storyFetched) {
          story = await api(`item/${id}`).json();
          stories[index] = story;
          set({ stories });
          updateItem('stories', stories, STORIES_TTL);
        }
      },
      { cache },
    ),
    100,
  ),
  items: new Map(),
  fetchItem: async (id) => {
    console.log(`🪂 fetchItem ${id}`);
    const { stories, items } = get();
    const index = stories.findIndex((s) => s.id === id);
    let story = stories[index];
    const storyFetched = !!story?.comments?.length;
    if (story && !storyFetched) {
      story = await api(`item/${id}`).json();
      stories[index] = story;
      set({ stories });
      updateItem('stories', stories, STORIES_TTL);
    } else {
      if (items.has(id)) return;
      const item = await algoliaApi(`items/${id}`).json();
      items.set(id, item);
      set({ items });
    }
  },
  minimalItems: new Map(),
  fetchMinimalItem: async (id) => {
    console.log(`🔻 fetchMinimalItem ${id}`);
    const { minimalItems } = get();
    if (minimalItems.has(id)) {
      return minimalItems.get(id);
    }
    const item = await officialApi(`item/${id}.json`, {
      timeout: 1000, // 1s
    }).json();
    minimalItems.set(id, item);
    set({ minimalItems });
    return item;
  },
  links: [],
  initLinks: async () => {
    console.log(`🥞 initLinks`);
    let links = await getItem('links');
    if (links) set({ links });
  },
  visited: (link) => {
    let { links } = get();
    return links.indexOf(link) !== -1;
  },
  addLink: (link) => {
    console.log(`🥞 addLink ${link}`);
    let { links } = get();
    const index = links.indexOf(link);
    if (index === -1) {
      // Not found
      links.unshift(link);
      links = links.slice(0, 100);
    } else {
      // Found
      arrayMoveMutable(links, index, 0);
    }
    set({ links });
    setItem('links', links);
  },
  userInfo: new Map(),
  setUserInfo: (user, info) => {
    console.log(`🥞 setUserInfo ${user}`);
    const { userInfo } = get();
    userInfo.set(user, info);
    set({ userInfo });
  },
  // Remember scroll Y for every story
  storyScroll: new Map(),
  setStoryScroll: (storyID, scrollY) => {
    // console.log(`🥞 setStoryScroll ${storyID} ${scrollY}`);
    const { storyScroll } = get();
    if (!storyScroll.has(storyID)) {
      storyScroll.clear();
    }
    storyScroll.set(storyID, scrollY || 0);
    set({ storyScroll });
  },
  settings: {
    interactions: false,
    syntaxHighlighting: false,
  },
  initSettings: async () => {
    console.log(`🥞 initSettings`);
    let settings = await getItem('settings');
    if (settings) set({ settings });
  },
  setSetting: (key, value) => {
    console.log(`🥞 setSetting ${key}`);
    const { settings } = get();
    settings[key] = value;
    set({ settings });
    setItem('settings', settings);
  },
}));

export default useStore;
