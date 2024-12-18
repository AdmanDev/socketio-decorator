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
- [Data validation](#data-validation)
  - [Setup](#setup)
  - [Disable validation for a specific handler](#disable-validation-for-a-specific-handler)
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
            "module": "Node16",
            "experimentalDecorators": true,
            "emitDecoratorMetadata": true
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
            await something()
            return {
                message: "Hello you"
            }
        }

    }
    ```

    The `SocketController` class contains 3 methods: `onConnection`, `onMessage` and `onHello`.

    The `onConnection` method listens for the socket connection event. The `onMessage` method listens for a `message` event and logs the received data. The `onHello` method listens for a `hello` event, waits for 2 seconds, and emits a `hello-back` event with the message "Hello you".

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

    You can now test the server by connecting with Postman or another WebSocket client and sending a `message` event. You should see the message logged in the console.

## Decorators

### Listening for Events

The following decorators can be used to listen for events:

| Decorator               | Description                                              | Equivalent in Basic Socket.io       |
|-------------------------|----------------------------------------------------------|-------------------------------------|
| `@ServerOn(event: string)`     | Listens for server events.            | `io.on(event, callback)`            |
| `@SocketOn(event: string)`     | Listens for events emitted by the client.             | `socket.on(event, callback)`        |
| `@SocketOnce(event: string)`   | Listens for events emitted by the client only once.    | `socket.once(event, callback)`      |
| `@SocketOnAny()`               | Listens for any event emitted by the client.           | `socket.onAny(callback)`            |
| `@SocketOnAnyOutgoing()`       | Listens for any outgoing event.  | `socket.onAnyOutgoing(callback)`    |

#### Example

---

##### @SeverOn(event: string)

**Equivalent in basic Socket.io:** `io.on(event, callback)`

Listens for server events.

**Usage** :

```typescript
@ServerOn("connection")
public onConnection(socket: Socket) {
    console.log("Socket connected with socket id", socket.id);
}
```

---

##### @SocketOn(event: string)

**Equivalent in basic Socket.io:** `socket.on(event, callback)`

Listens for events emitted by the client.

**Usage** :

```typescript
@SocketOn("message")
public onMessage(socket: Socket, data: any) {
    console.log("Message received:", data);
}
```

---

##### @SocketOnce(event: string)

**Equivalent in basic Socket.io:** `socket.once(event, callback)`

Listens for events emitted by the client only once.

**Usage** :

```typescript
@SocketOnce("message")
public onMessage(socket: Socket, data: any) {
    console.log("Message received:", data);
}
```

---

##### @SocketOnAny()

**Equivalent in basic Socket.io:** `socket.onAny(callback)`

Listens for any event emitted by the client.

**Usage** :

```typescript
@SocketOnAny()
public onAnyEvent(socket: Socket, event: string, data: any) {
    console.log("Any event received:", event, data);
}
```

---

##### @SocketOnAnyOutgoing()

**Equivalent in basic Socket.io:** `socket.onAnyOutgoing(callback)`

Listens for any outgoing event

**Usage** :

```typescript
@SocketOnAnyOutgoing()
public onAnyOutgoingEvent(socket: Socket, event: string, data: any) {
    console.log("Any outgoing event received:", event, data);
}
```

### Emitting Events

The following decorators can be used to emit events to the client:

| Decorator               | Description                                             | Equivalent in Basic Socket.io        |
|-------------------------|---------------------------------------------------------|--------------------------------------|
| `@ServerEmitter(event?: string, to?: string)`  | Emits event from the server.                        | `io.emit(event, data)`               |
| `@SocketEmitter(event:? string)`  | Emits event from the socket.                  | `socket.emit(event, data)`           |

#### How to use

1. **Basic usage**

    The return value of the method is sent as the data of the event.

    ```typescript
    @SocketOn("get-latest-message")
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

    - You can also specify options for the emitted event by returning an `EmitterOption` object.

        ```typescript
        import { EmitterOption, SocketEmitter } from "@admandev/socketio-decorator"
        import { Socket } from "socket.io"

        @SocketOn("get-latest-message")
        @SocketEmitter() // No event name specified
        public sendMessage(socket: Socket): EmitterOptions {
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
.

    - If you return an array of `EmitterOption` objects, an event will be emitted for each `EmitterOption` items.

        ```typescript
        @SocketOn("multiple-events")
        @ServerEmitter()
        onMultipleEvents(socket: Socket) {
            socket.join("multiple-events");
            const events: EmitterOption[] = [
                new EmitterOption({
                    to: socket.id,
                    message: "event-1",
                    data: {
                        message: "This is event 1"
                    }
                }),
                new EmitterOption({
                    to: "multiple-events",
                    message: "event-2",
                    data: {
                        message: "This is events-2"
                    }
                }),
            ]

            return events
        }
        ```

        The above code will emit two events: `event-1` and `event-2`.
        `event-1` will be emitted to the client with the `id` of the socket and `event-2` will be emitted to the `multiple-events` room.

    **Emitter options**
    The `EmitterOption` object has the following properties:

    | Property | Type | Required | Description |
    |----------|------|----------|-------------|
    | `to`     | string | No (if the decorator provides this) | The target to emit the event to. |
    | `message`| string | No (if the decorator provides this) | The event name to emit. |
    | `data`   | any    | Yes | The data to emit. |
    | `disableEmit` | boolean | No | If `true`, the event will not be emitted. |

3. **Emitting falsy value**
    If the method returns a falsy value (false, null undefined, 0, ...), the event will not be emitted.

#### Examples

---

##### @ServerEmitter(event?: string, to?: string)

**Equivalent in basic Socket.io:** `io.emit(event, data)` or `io.to(to).emit(event, data)`

Emits events to all connected clients or to a specific room if the `to` parameter is provided.

> [!WARNING]
> This decorator must be used with a listener decorator (ServerOn or SocketOn) to work.

**Usages** :

```typescript
@SocketOn("message")
@ServerEmitter("newMessage", "room1")
public sendMessage() {
    return { message: "Hello, world!" }
}
```

```typescript
@SocketOn("message")
@ServerEmitter()
public sendMessage() {
    return new EmitterOption({
        to: "room1",
        message: "newMessage",
        data: { message: "Hello, world!" },
    })
}
```

---

##### @SocketEmitter(event?: string)

**Equivalent in basic Socket.io:** `socket.emit(event, data)`

Emits event to the current client.

> [!WARNING]
> If the `event` parameter is not provided in decorator, it must be provided in the `EmitterOption` object.

> [!WARNING]
> This decorator must be used with a listener decorator (ServerOn or SocketOn) to work.

**Usage** :

```typescript
@SocketOn("get-user")
@SocketEmitter("get-user-resp")
public getUser(socket: Socket) {
    return useCurrentUser(socket)
}
```

```typescript
@SocketOn("get-user")
@SocketEmitter()
public getUser(socket: Socket) {
    return new EmitterOption({
        to: socket.id,
        message: "get-user-resp",
        data: useCurrentUser(socket),
    })
}
```

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
        ...,
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
        ...,
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
        handleError (error: any, socket?: Socket) {
            // Handle the error here
            console.log('Error middleware: ', error);
        }
    }
    ```

2. **Register the Middleware**

    Update the `app.ts` file to register the middleware:

     ```typescript
     useSocketIoDecorator({
          ...,
          errorMiddleware: MyErrorMiddleware, // Add the unique error middleware here
     })
     ```

## Data validation

You can use the `class-validator` library to validate the data received from the client and be sure that required fields are present and have the correct type.

### Setup

1. **Install the following libraries**

    ```bash
    npm install class-validator class-transformer reflect-metadata
    ```

2. **Import the `reflect-metadata` library**
  
    Add the following line at the top of your `app.ts` file:

    ```typescript
    import "reflect-metadata"
     ```

3. **Be sure to enable the `emitDecoratorMetadata` option in your `tsconfig.json` file**

    ```json
    {
        "compilerOptions": {
            "emitDecoratorMetadata": true
        }
    }
    ```

4. **Enable the validation option in the `useSocketIoDecorator` config**

    ```typescript
    useSocketIoDecorator({
        ...,
        dataValidationEnabled: true
    })
    ```

5. **Create and use a class with validation rules**

    ```typescript
    import { IsString } from "class-validator"

    export class MessageData {
        @IsString()
        message: string
    }
    ```

    Use the class in the event handler:

    ```typescript
    @SocketOn("message")
    public onMessage(socket: Socket, data: MessageData) {
        console.log("Message received:", data.message)
    }
    ```

    If the data does not match the validation rules, an error will be thrown before the event handler is called.

> [!WARNING]
> We recommend using the [error handling middleware](#error-handling-middleware) to catch and handle validation errors.

### Disable validation for a specific handler

You can disable validation for a specific handler by setting the `disableDataValidation` option to `true`:

```typescript
@SocketOn("message", { disableDataValidation: true })
public onMessage(socket: Socket, data: MessageData) {
    ...
}
```

#### Default enabled validation

Data validation works only on socket listeners (not server listeners or emitters).

Here is the default value for the `disableDataValidation` option:

- `@SocketOn` - `false`
- `@SocketOnce` - `false`
- `@SocketOnAny` - `true` - If you want to validate the data, you need to set the option to `false`
- `@SocketOnAnyOutgoing` - `true` because it is not an incoming event from the client

### Learn more about data validation

For more information on data validation, see the [class-validator documentation](https://github.com/typestack/class-validator).

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
        ...,
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
    ...,
    iocContainer: Container,
})
```

Note: Your Container object must provide the `get` method to resolve dependencies.

Note 2: Your controllers and middlewares must be registered in the DI container.

**Important**: The `iocContainer` option is optional. If you don't provide it, Socketio Decorator will create a new instance of the controllers or middlewares and keep them in memory.

## Sample project

You can find a sample project using express [here](https://github.com/AdmanDev/socketio-decorator/tree/master/examples/nodeexample).

## Thanks

Thank you for using Socketio Decorator. If you have any questions or suggestions, feel free to open an issue on the [GitHub repository](https://github.com/AdmanDev/socketio-decorator/issues).
