# React Native AI

Full stack mobile framework for building cross-platform mobile AI apps supporting LLM real-time / streaming text and chat UIs, image services and natural langauge to images with multiple models, and image processing.

![React Native AI](rnaiheader.png)

## Features

- LLM support for [OpenAI](https://openai.com/) ChatGPT, [Anthropic](https://anthropic.com) Claude, [Cohere](https://cohere.com/) and Cohere Web
- An array of image models provided by [Fal.ai](https://www.fal.ai/)
- Real-time / streaming responses from all providers
- OpenAI Assistants including code interpreter and retrieval
- Server proxy to easily enable authentication and authorization with auth provider of choice.
- Theming (comes out of the box with 4 themes) - easily add additional themes with just a few lines of code.
- Image processing with [ByteScale](https://bytescale.com/)

![React Native AI Preview](screenzzz.png)

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

## Configuring LLM Models

Here is how to add new or remove existing LLM models.

### In the app

You can add or configure a model by updating `MODELS` in `constants.ts`.

For removing models, just remove the models you do not want to support.

For adding models, once the model definition is added to the `MODELS` array, you should update `src/screens/chat.tsx` to support the new model:

1. Create local state to hold new model data
2. Update `chat()` function to handle new model type
3. Create `generateModelReponse` function to call new model
4. Update `getChatType` in `utils.ts` to configure the LLM type that will correspond with your server path.
5. Render new model in UI

```tsx
{
  chatType.label.includes('newModel') && (
    <FlatList
      data={newModelReponse.messages}
      renderItem={renderItem}
      scrollEnabled={false}
    />
  )
}
```

### On the server

Create a new file in the `server/src/chat` folder that corresponds to the model type you created in the mobile app. You can probably copy and re-use a lot of the streaming code from the other existing paths to get you started.

Next, update `server/src/chat/chatRouter` to use the new route.

## Configuring Image Models

Here is how to add new or remove existing Image models.

### In the app

You can add or configure a model by updating `IMAGE_MODELS` in `constants.ts`.

For removing models, just remove the models you do not want to support.

For adding models, once the model definition is add to the `IMAGE_MODELS` array, you should update `src/screens/images.tsx` to support the new model.

Main consideration is input. Does the model take text, image, or both as inputs?

The app is configured to handle both, but you must update the `generate` function to pass the values to the API accordingly.

### On the server

#### Fal.ai

In `server/src/images/fal`, update the handler function to take into account the new model.

#### Other API providers

Create a new file in `server/src/images/modelName`, update the handler function to handle the new API call.

Next, update `server/src/images/imagesRouter` to use the new route.