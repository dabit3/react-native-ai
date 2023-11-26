# React Native AI CLI

Full stack mobile framework for building cross-platform mobile AI apps supporting image processing, real-time / streaming text and chat UIs, and image uploads with multiple service providers.

![React Native AI](https://raw.githubusercontent.com/dabit3/react-native-ai/main/rnaiheader.png?token=GHSAT0AAAAAACBYUBA6SWS42HLQGMVX6J7UZLDIQQQ)

## Features

- LLM support for [OpenAI](https://openai.com/) ChatGPT, [Anthropic](https://anthropic.com) Claude, [Cohere](https://cohere.com/) and Cohere Web
- An array of image models provided by [Fal.ai](https://www.fal.ai/)
- Image processing with [ByteScale](https://bytescale.com/)
- Real-time / streaming responses from all providers
- OpenAI Assistants including code interpreter and retrieval
- Server proxy to easily enable authentication and authorization with auth provider of choice.
- Theming (comes out of the box with 4 themes) - easily add additional themes with just a few lines of code.

![React Native AI Preview](https://raw.githubusercontent.com/dabit3/react-native-ai/main/screenzzz.png?token=GHSAT0AAAAAACBYUBA6Y53GTKQE3JVD4BK4ZLDIRHA)

## Usage

Generate a new project by running:

```sh
npx rn-ai
```

Next, either configure your environment variables with the CLI, or do so later.

### Running the app

Change into the app directory and run:

```sh
npm start
```

### Running the server

Change into the server directory and run:

```sh
npm run dev
```