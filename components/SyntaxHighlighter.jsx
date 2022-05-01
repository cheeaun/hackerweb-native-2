// Light build, BUT with all languages
// https://github.com/react-syntax-highlighter/react-syntax-highlighter#light-build
import highlight from 'react-syntax-highlighter/dist/esm/highlight';

import lowlight from 'lowlight';

var highlighter = highlight(lowlight, {});
export default highlighter;
