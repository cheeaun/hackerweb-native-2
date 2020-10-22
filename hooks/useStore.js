import AsyncStorage from '@react-native-community/async-storage';
import create from 'zustand';
import ky from 'ky';
import arrayMove from 'array-move';

const API_ROOT = 'https://api.hackerwebapp.com';
const api = ky.create({ prefixUrl: API_ROOT });
const STORIES_TTL = 10 * 60 * 1000; // 10 mins

function setItem(key, val, ttl) {
  if (!key || !val) return;
  return AsyncStorage.setItem(
    key,
    JSON.stringify({
      data: val,
      expire: ttl ? Date.now() + ttl : undefined,
    }),
  );
}

async function updateItem(key, val) {
  if (!key || !val) return;
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
    return setItem(key, val);
  }
}

async function getItem(key) {
  if (!key) return;
  const json = await AsyncStorage.getItem(key);
  if (json) {
    const { data, expire } = JSON.parse(json);
    if (expire && expire <= Date.now()) {
      AsyncStorage.removeItem(key);
      return null;
    } else {
      return data;
    }
  }
  return null;
}

const useStore = create((set, get) => ({
  lastBackgroundTime: null,
  setLastBackgroundTime: (lastBackgroundTime) => set({ lastBackgroundTime }),
  updateIsAvailable: false,
  setUpdateIsAvailable: (updateIsAvailable) => set({ updateIsAvailable }),
  stories: [],
  fetchStories: async () => {
    let stories = await getItem('stories');
    if (stories) {
      if (get().stories.length) return;
      set({ stories });
    } else {
      stories = await api('news').json();
      set({ stories });
      setItem('stories', stories, STORIES_TTL);
    }
  },
  fetchStory: async (id) => {
    const { stories } = get();
    const index = stories.findIndex((s) => s.id === id);
    let story = stories[index];
    const storyFetched = !!story?.comments?.length;
    if (!storyFetched) {
      story = await api(`item/${id}`).json();
      stories[index] = story;
      set({ stories });
      updateItem('stories', stories);
    }
  },
  currentOP: null,
  setCurrentOP: (currentOP) => set({ currentOP }),
  links: [],
  initLinks: async () => {
    let links = await getItem('links');
    if (links) set({ links });
  },
  visited: (link) => {
    let { links } = get();
    return links.indexOf(link) !== -1;
  },
  addLink: (link) => {
    let { links } = get();
    const index = links.indexOf(link);
    if (index === -1) {
      // Not found
      links.unshift(link);
      links = links.slice(0, 100);
    } else {
      // Found
      links = arrayMove(links, index, 0);
    }
    set({ links });
    setItem('links', links);
  },
  userInfo: new Map(),
  setUserInfo: (user, info) => {
    const { userInfo } = get();
    userInfo.set(user, info);
    set({ userInfo });
  },
}));

export default useStore;
