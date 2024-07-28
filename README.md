# Socketio Decorator

This library allows you to use [Socket.io](https://socket.io/) with TypeScript decorators, simplifying the integration and usage of Socket.io in a TypeScript environment.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Decorators](#decorators)
  - [Listening for Events](#listening-for-events)
  - [Emitting Events](#emitting-events)
- [Middlewares](#middlewares)
  - [Server Middleware](#server-middleware)
  - [Socket Middleware](#socket-middleware)
  - [Error handling middleware](#error-handling-middleware)
- [Hooks](#hooks)
  - [UseIoServer hook](#useioserver-hook)
  - [UseCurrentUser hook](#usecurrentuser-hook)
- [Dependency Injection](#dependency-injection)

## Installation

To get started, follow these steps:

1. Install the package:

    ```bash
    npm install @admandev/socketio-decorator
    ```

2. Install the required peer dependencies for Socket.io:

    ```bash
    npm install socket.io
    ```

3. Update your `tsconfig.json` to enable decorators:

    ```json
    {
        "compilerOptions": {
            "experimentalDecorators": true
        }
    }
    ```

## Usage

1. **Create a Socket Controller**

   Create a file named `SocketController.ts` with the following content:

    ```typescript
    import { ServerOn, SocketOn, SocketEmitter } from "@admandev/socketio-decorator";
    import { Socket } from "socket.io";

    export class SocketController {
        @ServerOn("connection")
        public onConnection(socket: Socket) {
            console.log("Socket connected with socket id", socket.id);
        }

        @SocketOn("message")
        public onMessage(socket: Socket, data: any) {
            console.log("Message received:", data);
        }

        // Async / Await is supported
        @SocketOn("hello")
        @SocketEmitter("hello-back")
        public async onHello() {
            await new Promise((resolve) => setTimeout(resolve, 2000))
            return {
                message: "Hello you"
            }
        }

    }
    ```

    - `@ServerOn(event: string)` is used to listen for server events. In the example, it listens for the `connection` event when a new client connects.
    - `@SocketOn(event: string)` is used to listen for client events. In the example, it listens for the `message` event when a client sends a message to the server.

2. **Set Up the Server**

   Create a file named `app.ts` with the following content:

    ```typescript
    import { useSocketIoDecorator } from "@admandev/socketio-decorator";
    import express from "express";
    import http from "http";
    import { Server } from "socket.io";
    import { SocketController } from "./SocketController";

    const app = express();
    const server = http.createServer(app);

    const io = new Server(server);

    useSocketIoDecorator({
        ioserver: io,
        controllers: [SocketController],
    });

    server.listen(3000, () => {
        console.log("Server running on port 3000");
    });
    ```

3. **Run the Server**

    Start the server by running:

    ```bash
    node dist/app.js
    ```

    Ensure you have compiled your TypeScript files into JavaScript using `tsc`.

    You can now test the server by connecting with Postman or another WebSocket client and sending a `message` event. You should see the message logged in the console.

## Decorators

### Listening for Events

| Decorator               | Description                                              | Equivalent in Basic Socket.io       |
|-------------------------|----------------------------------------------------------|-------------------------------------|
| `@ServerOn(event: string)`     | Listens for events emitted by the server.            | `io.on(event, callback)`            |
| `@SocketOn(event: string)`     | Listens for events emitted by the client.             | `socket.on(event, callback)`        |
| `@SocketOnce(event: string)`   | Listens for events emitted by the client only once.    | `socket.once(event, callback)`      |
| `@SocketOnAny()`               | Listens for any event emitted by the client.           | `socket.onAny(callback)`            |
| `@SocketOnAnyOutgoing()`       | Listens for any outgoing event emitted by the client.  | `socket.onAnyOutgoing(callback)`    |

### Emitting Events

| Decorator               | Description                                             | Equivalent in Basic Socket.io        |
|-------------------------|---------------------------------------------------------|--------------------------------------|
| `@ServerEmitter(event?: string)`  | Emits events from the server.                        | `io.emit(event, data)`               |
| `@SocketEmitter(event:? string)`  | Emits events from the client socket.                  | `socket.emit(event, data)`           |

#### How to use

1. **Basic Usage**

    The return value of the method is sent as the data of the event.

    ```typescript
    @SocketEmitter("message")
    public sendMessage() {
        return { message: "Hello, world!" }
    }
    ```

    The above code will emit a `message` event with the following data:

    ```json
        {
            "message": "Hello, world!"
        }
    ```

2. **Emitting options**

    You can also specify options for the emitted event by returning an `EmitOption` object.

    ```typescript
    import { EmitterOption, SocketEmitter } from "@admandev/socketio-decorator"
    import { Socket } from "socket.io"

    @SocketEmitter() // No event name specified
    public sendMessage(socket: Socket): EmitOptions {
        const isAllowedToSend = isUserAllowedToSendMessage(socket)
        return new EmitterOption({
            to: "room1",
            message: "newMessage",
            data: { message: "Hello, world!" },
            disableEmit: !isAllowedToSend,
        })
    }
    ```

    The above code will emit a `newMessage` event to the `room1` room. The event will only be emitted if the `isUserAllowedToSendMessage` function returns `true`.
\
    **Emit options**

    The `EmitOption` object has the following properties:

    | Property | Type | Required | Description |
    |----------|------|----------|-------------|
    | `to`     | string | No (if the decorator provides this) | The target to emit the event to. |
    | `message`| string | No (if the decorator provides this) | The event name to emit. |
    | `data`   | any    | Yes | The data to emit. |
    | `disableEmit` | boolean | No | If `true`, the event will not be emitted. |

3. **Emitting falsy value**

    If the method returns a falsy value (false, null undefined, 0, ...), the event will not be emitted.

## Middlewares

You can use middlewares to execute code before  an event is handled. Middlewares can be used to perform tasks such as authentication or logging.

### Server Middleware

A Server Middleware is executed for each incoming connection.

1. **Create a Middleware**

   Create a file named `MyServerMiddleware.ts` and create a class that implements the `IServerMiddleware` interface:

    ```typescript
    export class MyServerMiddleware implements IServerMiddleware {        
        use(socket: Socket, next: (err?: unknown) => void) {
            console.log("You can perform tasks here before the event is handled")
            next()
        }
    }
    ```

    The `use` method is called before any event is handled. You can perform any tasks here and call `next()` to proceed with the event handling.

2. **Register the Middleware**

   Update the `app.ts` file to register the middleware:

    ```typescript
    useSocketIoDecorator({
        ioserver: io,
        controllers: [SocketController],
        serverMiddlewares: [MyServerMiddleware], // Add the middleware here
    })
    ```

### Socket Middleware

A Socket Middleware is like Server Middleware but it is called for each incoming packet.

1. **Create a Middleware**

   Create a file named `MySocketMiddleware.ts` and create a class that implements the `ISocketMiddleware` interface:

    ```typescript
    import { ISocketMiddleware } from "@admandev/socketio-decorator"
    import { Event } from "socket.io"

    export class MySocketMiddleware implements ISocketMiddleware {
        use([event, ...args]: Event, next: (err?: Error) => void): void {
            console.log(`MySocketMiddleware triggered from ${event} event`)
            next()
        }
    }
    ```

2. **Register the Middleware**

   Update the `app.ts` file to register the middleware:

    ```typescript
    useSocketIoDecorator({
        ioserver: io,
        controllers: [SocketController],
        socketMiddlewares: [MySocketMiddleware], // Add the middleware here
    })
    ```

### Error handling middleware

You can create a middleware to handle errors that occur during event handling and above middlewares.

1. **Create an Error Middleware**

   Create a file named `MyErrorMiddleware.ts` and create a class that implements the `IErrorMiddleware` interface:

    ```typescript
    import { IErrorMiddleware } from "@admandev/socketio-decorator";
    import { Socket } from "socket.io";

    export class MyErrorMiddleware implements IErrorMiddleware{
        handleError (error: Error, socket?: Socket) {
            // Handle the error here
            console.log('Error middleware: ', error);
        }
    }
    ```

2. **Register the Middleware**

    Update the `app.ts` file to register the middleware:

     ```typescript
     useSocketIoDecorator({
          ioserver: io,
          controllers: [SocketController],
          errorMiddleware: MyErrorMiddleware, // Add the unique error middleware here
     })
     ```

## Hooks

Hooks in Socketio Decorator are functions that provides some data.

### UseIoServer hook

The `useIoServer` is the simpliest hook that provides the `io` socketio server object.

```typescript
import { useIoServer } from "@admandev/socketio-decorator"
import { Server } from "socket.io"

const io: Server = useIoServer()
```

### UseCurrentUser hook

The `useCurrentUser` hook provides the current user object. This hook is useful when you want to get the current user object in the event handler.

1. **Create the `currentUserProvider`**

   In the `app.ts` file, create a function that returns the current user object:

    ```typescript
    useSocketIoDecorator({
        ioserver: io,
        controllers: [SocketController],
        currentUserProvider: (socket: Socket) => {
            const token = socket.handshake.auth.token
            const user = userServices.getUserByToken(token)
            return user
        },
    })
    ```

2. **Use the `useCurrentUser` hook**

   In the event handler, use the `useCurrentUser` hook to get the current user object:

    ```typescript
    import { useCurrentUser, SocketOn } from "@admandev/socketio-decorator"
    import { Socket } from "socket.io"

    @SocketOn("message")
    public onMessage(socket: Socket, data: any) {
        const user = useCurrentUser(socket)
        console.log("Message received from user:", user)
    }
    ```

## Dependency Injection

Socketio Decorator supports dependency injection using a DI library. You can inject services into your controllers and middlewares.

To allow Socketio Decorator to work with your DI system, you need to provide the `Container` object to the `useSocketIoDecorator` options.

```typescript
import { Container } from "typedi"

useSocketIoDecorator({
    ioserver: io,
    controllers: [SocketController],
    iocContainer: Container,
})
```

Note: Your Container object must provide the `get` method to resolve dependencies.

Note 2: Your controllers and middlewares must be registered in the DI container.

**Important**: The `iocContainer` option is optional. If you don't provide it, Socketio Decorator will create a new instance of the controllers or middlewares and keep them in memory.

## Sample Project

You can find a sample project using express [here](https://github.com/AdmanDev/socketio-decorator/tree/master/examples/nodeexample).

## Thanks

Thank you for using Socketio Decorator. If you have any questions or suggestions, feel free to open an issue on the [GitHub repository](https://github.com/AdmanDev/socketio-decorator/issues).
