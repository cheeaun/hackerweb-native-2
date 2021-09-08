import AsyncStorage from '@react-native-async-storage/async-storage';
import create from 'zustand';
import ky from 'ky';
import { arrayMoveMutable } from 'array-move';
import pMemoize from 'p-memoize';

const API_ROOT = 'https://api.hackerwebapp.com';
const api = ky.create({
  prefixUrl: API_ROOT,
  hooks: {
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
  },
});
const STORIES_TTL = 10 * 60 * 1000; // 10 mins

function setItem(key, val, ttl) {
  if (!key || !val) return;
  console.log(`💾 SET ${key} ${ttl}`);
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
    if (stories) {
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
  fetchStory: pMemoize(
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
    { maxAge: 60 * 1000 },
  ),
  currentOP: null,
  setCurrentOP: (currentOP) => {
    console.log(`🥞 setCurrentOP ${currentOP}`);
    set({ currentOP });
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
}));

export default useStore;
