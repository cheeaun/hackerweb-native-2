<div align="center">
  <img src="assets/icon.png" width="200">

  # HackerWeb 2

**A read-only Hacker News client.**
<br>
<br>
<br>
</div>

HackerWeb is a super-clean Hacker News app built for maximum readability and has a lean set of features to optimize the reading experience.

It’s created specifically with iOS design guidelines in mind, so it feels native and blends well with the operating system.

It has a simple set of features that are usually invisible:

- Dual Web and Comments tabs for easy switching between the story’s web page and the list of comments
- Revolutionary comments thread UI for easy navigation, with smart collapsing to prevent being overwhelmed by too many comments
- Automatic Dark mode, respecting the system’s appearance settings.
- Smart indentations and formatting for comments, complementing the existing limited formatting from Hacker News.
- Automatic syntax highlighting for code blocks in comments, with best-effort programming language detection.
- Allow interactions like upvoting and replying, which opens up web view with login information and sessions stored in itself, instead of the app.
- Comment’s “Thread view” to list all parent comments of a comment, on a flat list, for easy reading instead of manually drilling down the nested comments.
- “Share as Image” for comments, which allows sharing of a specific comment, optionally including the parent comments and/or story, as an image.

HackerWeb is an unofficial Hacker News client, built with React Native and Expo.

This is a passion side project for learning and experimenting ideas. Since 2012.

Also a complete rewrite of the first version launched in 2016.

- V1: https://github.com/cheeaun/hackerweb-native
- Story: http://cheeaun.com/blog/2016/03/building-hackerweb-ios/

## Download

[![Download on the App Store](https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg)](https://apps.apple.com/app/id1084209377) [<img src="https://askyourself.app/assets/testflight.png" height="40">](https://testflight.apple.com/join/PHcLooxC)

- App Store: https://apps.apple.com/app/id1084209377
- TestFlight: https://testflight.apple.com/join/PHcLooxC

## Preview

### Light

<img src="screenshots/hackerweb-stories-light.png" width="250"> <img src="screenshots/hackerweb-story-light.png" width="250">

### Dark

<img src="screenshots/hackerweb-stories-dark.png" width="250"> <img src="screenshots/hackerweb-story-dark.png" width="250">

## Development

This is built with [Expo](https://expo.io/) under the **Managed Workflow**. Currently using **SDK 54** and **targeted only for iOS** (for now).

```
npm install -g expo-cli
```

After cloning this repository:

```
cd hackerweb-native-2
npm i
npm start
```

## Resources

- API:
  - [node-hnapi](https://github.com/cheeaun/node-hnapi)
  - [HN Search API (Algolia)](https://hn.algolia.com/api)
  - [Official API (Firebase)](https://github.com/HackerNews/API)
- Icons from [SF Symbols](https://developer.apple.com/sf-symbols/)
- [Awesome Hacker News](https://github.com/cheeaun/awesome-hacker-news)

## License

- [MIT](http://cheeaun.mit-license.org/).
- Not affiliated with Hacker News or YCombinator.
