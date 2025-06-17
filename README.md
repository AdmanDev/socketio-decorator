
# Socketio Decorator

Use TypeScript decorators to simplify working with [Socket.IO](https://socket.io/) in your Node.js applications.

This library provides an elegant and declarative way to define Socket.IO event listeners, emitters, middlewares, and more — all using modern TypeScript decorators.

## 📚 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Decorators](#decorators)
  - [Listening for Events](#listening-for-events)
  - [Emitting Events](#emitting-events)
  - [Parameter injection](#parameter-injection-decorators)
  - [Other decorators](#other-decorators)
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
    npm install @admandev/socketio-decorator socket.io
    ```

    > [!NOTE]
    > ℹ️ Peer dependencies like `reflect-metadata` and `class-validator` may also be required depending on your use case (see [Data Validation](#data-validation)).

2. Update your `tsconfig.json` to enable decorators:

    ```json
    {
        "compilerOptions": {
            "module": "Node16 (or more recent)",
            "experimentalDecorators": true,
            "emitDecoratorMetadata": true
        }
    }
    ```

## Quick Start

1. **Create a Socket Controller**

    ```typescript
    import { Data, ServerOn, SocketOn, SocketEmitter } from "@admandev/socketio-decorator";
    import { Socket } from "socket.io";

    export class SocketController {
        @ServerOn("connection")
        public onConnection(socket: Socket) {
            console.log("Socket connected with socket id", socket.id);
        }

        @SocketOn("message")
        public onMessage(socket: Socket, @Data() data: any) {
            console.log("Message received:", data);
        }

        // Async / Await is supported
        @SocketOn("hello")
        @SocketEmitter("hello-back") // Emit returned data as response, automatically
        public async onHello() {
            await something()
            return {
                message: "Hello you"
            }
        }

    }
    ```

2. **Set Up the Server**

   In your `app.ts` file, set up the server and use the Controller:

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

    You can also auto import controllers from a directory:

    ```typescript
    useSocketIoDecorator({
        controllers: [path.join(__dirname, "/controllers/*.js")],
        ...
    });
    ```

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
public onMessage(socket: Socket, @Data() data: any) {
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
public onMessage(socket: Socket, @Data() data: any) {
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
public onAnyEvent(socket: Socket, event: string, @Data() data: any) {
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
public onAnyOutgoingEvent(socket: Socket, event: string, @Data() data: any) {
    console.log("Any outgoing event received:", event, data);
}
```

### Emitting Events

The following decorators can be used to emit events to the client:

| Decorator               | Description                                             | Equivalent in Basic Socket.io        |
|-------------------------|---------------------------------------------------------|--------------------------------------|
| `@ServerEmitter(event?: string, to?: string)`  | Emits event to all clients.                        | `io.emit(event, data)`               |
| `@SocketEmitter(event:? string)`  | Emits event to specific client.                  | `socket.emit(event, data)`           |

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

    The above code will emit a `message` event with the following data as response to the client :

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

        @SocketOn("chat-message")
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

**Usages** :

```typescript
@ServerEmitter("newMessage", "room1")
public sendMessage() {
    return { message: "Hello, world!" }
}
```

```typescript
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

### Parameter injection decorators

The following decorators can be used to inject parameters into the event handler methods:

| Decorator | Description                                              |
|-----------|----------------------------------------------------------|
| `@CurrentSocket()` | Injects the current socket instance that is handling the message. |
| `@Data(dataIndex?: number)` | Injects the data sent by the client                 |

#### Examples

---

##### @CurrentSocket()

Injects the current socket instance that is handling the message.

**Usage** :

```typescript
@SocketOn("joinGame")
public onJoinGame(@CurrentSocket() socket: Socket) {
    socket.join("gameRoom");
}
```

---

##### @Data(dataIndex?: number)

Injects the data sent by the client.

**Usage** :

```typescript
@SocketOn("message")
public onMessage(@Data() data: MessageData) {
    console.log("Message received:", data.message)
}
```

You can also specify the index of the data in the socket message if you want to inject a specific part of the data:

```typescript
@SocketOn("chat-message")
public onChatMessage(@Data(0) message: string, @Data(1) roomId: string) {
    console.log(`Received message: "${message}" for room: ${roomId}`);
}
```

This is useful when the client sends multiple arguments:

```typescript
// Client side
socket.emit("chat-message", "Hello everyone!", "gaming-lobby");
```

### Other decorators

| Decorator | Description                                              |
|-------------------------|----------------------------------------------------------|
| `@UseSocketMiddleware(...ISocketMiddleware[])` | Applies one or more socket middleware to the event handler or controller class. |

#### Examples

---

##### @UseSocketMiddleware(...ISocketMiddleware[])

Applies one or more socket middlewares to the event handler or controller class.

**Usage** :

First create a [socket middleware](#socket-middleware) before choosing one of next steps.

1. **Use it on an event handler method**:

    ```typescript
    @SocketOn("message")
    @UseSocketMiddleware(MyMiddleware1, MyMiddleware2)
    public onMessage() {
        console.log("Message received")
    }
    ```

    In this case, the `MyMiddleware1` and `MyMiddleware2` will be called before the `onMessage` event handler is executed.

2. **Use it on a controller class**:

    ```typescript
    @UseSocketMiddleware(MyMiddleware)
    export class MyController {
        @SocketOn("event1")
        public onEvent1() {
            console.log("Event 1 received")
        }

        @SocketOn("event2")
        public onEvent2() {
            console.log("Event 2 received")
        }
    }
    ```

    In this case, the `MyMiddleware` will be applied to all event handlers in the `MyController` class.

    > [!NOTE]
    > This decorator is applied to socket listener handlers only (`@SocketOn`, `@SocketOnce`, `@SocketOnAny`, ...).
    > It does not apply to server listeners (`@ServerOn`) or emitters.

## Middlewares

You can use middlewares to execute code before  an event is handled. Middlewares can be used to perform tasks such as authentication or logging.

### Server Middleware

A Server Middleware is executed for each incoming connection.

1. **Create a Middleware**

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

2. **Use the Middleware**

    Now you can use the socket middleware in 2 ways:

    - **Globally**: This will apply the middleware to all events in your application.
    Update the `app.ts` file to register the middleware:

        ```typescript
        useSocketIoDecorator({
            ...,
            socketMiddlewares: [MySocketMiddleware], // Add the middleware here
        })
        ```

    - **Per event**: You can also use the middleware for a specific event by using the [@UseSocketMiddleware decorator](#other-decorators).

### Error handling middleware

You can create a middleware to handle errors that occur during event handling and above middlewares.

1. **Create an Error Middleware**

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
        @IsNotEmpty()
        message: string
    }
    ```

    Use the class in the event handler:

    ```typescript
    @SocketOn("message")
    public onMessage(@Data() data: MessageData) {
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
public onMessage(@Data() data: MessageData) {
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
            return userServices.getUserByToken(token)
        },
    })
    ```

2. **Use the `useCurrentUser` hook**

   In the event handler, use the `useCurrentUser` hook to get the current user object:

    ```typescript
    import { useCurrentUser, SocketOn } from "@admandev/socketio-decorator"
    import { Socket } from "socket.io"

    @SocketOn("message")
    public onMessage(socket: Socket, @Data() data: any) {
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

> [!NOTE]
> Your Container object must provide the `get` method to resolve dependencies.

## 🧪 Example project

Check out the full example using Express:
👉 [Example on GitHub](https://github.com/AdmanDev/socketio-decorator/tree/master/examples/nodeexample)

## 🛠 Troubleshooting & Help

If you run into any issues or have suggestions, feel free to open an issue on GitHub:

🔗 [Socket.io Decorator Issues](https://github.com/AdmanDev/socketio-decorator/issues)

Thank you for using Socketio Decorator
