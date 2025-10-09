
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
  - [Namespace middleware](#namespace-middleware)
  - [Error handling middleware](#error-handling-middleware)
- [Rate Limiting](#rate-limiting)
- [Data validation](#data-validation)
  - [Setup](#setup)
  - [Disable validation for a specific handler](#disable-validation-for-a-specific-handler)
- [Application Events Bus](#application-events)
- [Hooks](#hooks)
  - [UseIoServer hook](#useioserver-hook)
  - [UseUserSocket hook](#useusersocket-hook)
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
    import { Data, ServerOn, SocketOn, SocketEmitter } from "@admandev/socketio-decorator"
    import { Socket } from "socket.io"

    export class SocketController {
        @ServerOn("connection")
        public onConnection(@CurrentSocket() socket: Socket) {
            console.log("Socket connected with socket id", socket.id)
        }

        @SocketOn("message")
        public onMessage(@CurrentSocket() socket: Socket, @Data() data: any) {
            console.log("Message received:", data, "from socket id:", socket.id)
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
    import { useSocketIoDecorator } from "@admandev/socketio-decorator"
    import express from "express"
    import http from "http"
    import { Server } from "socket.io"
    import { SocketController } from "./SocketController"

    const app = express()
    const server = http.createServer(app)

    const io = new Server(server)

    useSocketIoDecorator({
        ioserver: io,
        controllers: [SocketController],
    })

    server.listen(3000, () => {
        console.log("Server running on port 3000")
    })
    ```

    You can also auto import controllers from a directory:

    ```typescript
    useSocketIoDecorator({
        controllers: [path.join(__dirname, "/controllers/*.js")],
        ...
    })
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
public onConnection(@CurrentSocket() socket: Socket) {
    console.log("Socket connected with socket id", socket.id)
}
```

---

##### @SocketOn(event: string)

**Equivalent in basic Socket.io:** `socket.on(event, callback)`

Listens for events emitted by the client.

**Usage** :

```typescript
@SocketOn("message")
public onMessage(@Data() data: any) {
    console.log("Message received:", data)
}
```

---

##### @SocketOnce(event: string)

**Equivalent in basic Socket.io:** `socket.once(event, callback)`

Listens for events emitted by the client only once.

**Usage** :

```typescript
@SocketOnce("message")
public onMessage(@Data() data: any) {
    console.log("Message received:", data)
}
```

---

##### @SocketOnAny()

**Equivalent in basic Socket.io:** `socket.onAny(callback)`

Listens for any event emitted by the client.

**Usage** :

```typescript
@SocketOnAny()
public onAnyEvent(@EventName() event: string, @Data() data: any) {
    console.log("Any event received:", event, data)
}
```

---

##### @SocketOnAnyOutgoing()

**Equivalent in basic Socket.io:** `socket.onAnyOutgoing(callback)`

Listens for any outgoing event

**Usage** :

```typescript
@SocketOnAnyOutgoing()
public onAnyOutgoingEvent(@EventName() event: string, @Data() data: any) {
    console.log("Any outgoing event received:", event, data)
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
        public sendMessage(@CurrentSocket() socket: Socket): EmitterOptions {
            const isAllowedToSend = isUserAllowedToSendMessage(socket)
            return new EmitterOption({
                to: "room1",
                message: "newMessage", // Event name set here
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
        onMultipleEvents(@CurrentSocket() socket: Socket) {
            socket.join("multiple-events")
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
@SocketOn("join-room")
@SocketEmitter("room-joined")
public joinRoom(@CurrentSocket() socket: Socket) {
    socket.join("myRoom")
    return {
        info: `You have successfully joined room myRoom`,
        roomId: "myRoom"
    }
}
```

```typescript
@SocketOn("join-room")
@SocketEmitter()
public joinRoom(@CurrentSocket() socket: Socket) {
    socket.join("myRoom")
    return new EmitterOption({
        to: socket.id,
        message: "room-joined",
        data: {
            info: `You have successfully joined room myRoom`,
            roomId: "myRoom"
        },
    })
}
```

### Parameter injection decorators

The following decorators can be used to inject parameters into the event handler methods:

| Decorator | Description                                              |
|-----------|----------------------------------------------------------|
| `@CurrentSocket()` | Injects the current socket instance that is handling the message. |
| `@Data(dataIndex?: number)` | Injects the data sent by the client                 |
| `@EventName()` | Injects the name of the event message that triggered the handler. |
| `@CurrentUser()` | Injects the current user object. |
| `@SocketData(dataKey?: string)` | Injects socket data value (socket.data[dataKey]). |

#### Examples

---

##### @CurrentSocket()

Injects the current socket instance that is handling the message.

**Usage** :

```typescript
@SocketOn("joinGame")
public onJoinGame(@CurrentSocket() socket: Socket) {
    socket.join("gameRoom")
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
    console.log(`Received message: "${message}" for room: ${roomId}`)
}
```

This is useful when the client sends multiple arguments:

```typescript
// Client side
socket.emit("chat-message", "Hello everyone!", "gaming-lobby")
```

---

##### @EventName()

Injects the name of the event message that triggered the handler.

**Usage** :

```typescript
@SocketOn("user-joined")
@SocketOn("user-left")
public trackUserActivity(@EventName() event: string) {
    const action = event === "user-joined" ? "joined the chat" : "left the chat" 

    console.log(`User ${action}`)
}
```

---

##### @CurrentUser()

Injects the current user object into an event handler parameter.

**Usage** :

1. **Create the `currentUserProvider`**

   In the `app.ts` file, create a function that returns the current user object:

    ```typescript
    useSocketIoDecorator({
        ...,
        currentUserProvider: async (socket: Socket) => {
            const token = socket.handshake.auth.token
            return await userServices.getUserByToken(token)
        },
    })
    ```

2. **Use the `CurrentUser` decoratoar**

   In the event handler, use the `CurrentUser` decorator to get the current user object:

    ```typescript
    import { CurrentUser, SocketOn } from "@admandev/socketio-decorator"

    @SocketOn("message")
    public onMessage(@CurrentUser() user: User) {
        console.log("Message received from user:", user.name)
    }
    ```

---

##### @SocketData(dataKey?: string)

**Equivalent in basic Socket.io:** `socket.data[dataKey]`

Injects a socket data attribute value into an event handler parameter. SocketData decorator allow you to store custom data on a per-socket basis, which persists for the lifetime of the socket connection.

**Usage** :

1. **Inject the entire SocketDataStore**

   When used without a parameter, `@SocketData()` injects a `SocketDataStore` instance that provides methods to manage socket data attribute:

    ```typescript
    @SocketOn("save-user-preferences")
    public savePreferences(@SocketData() dataStore: SocketDataStore) {
        // Store user preferences on this socket
        dataStore.setData("theme", "dark")
        dataStore.setData("language", "fr")
        
        console.log("Preferences saved for this socket")
    }

    @SocketOn("get-user-preferences")
    @SocketEmitter("preferences")
    public getPreferences(@SocketData() dataStore: SocketDataStore) {
        return {
            theme: dataStore.getData("theme"),
            language: dataStore.getData("language")
        }
    }
    ```

    **SocketDataStore API**

    The `SocketDataStore` class provides the following methods:

    | Method | Parameters | Returns | Description |
    |--------|------------|---------|-------------|
    | `getData(key)` | `key: string` | `any \| null` | Retrieves the value of a socket data attribute. Returns `null` if the key doesn't exist. |
    | `setData(key, value)` | `key: string, value: any` | `void` | Sets a socket data with the specified key and value. |
    | `removeData(key)` | `key: string` | `void` | Removes a socket data attribute by key. |
    | `hasData(key)` | `key: string` | `boolean` | Checks if a socket data exists for the specified key. |

    **Type Safety with Generics**

    You can type the `SocketDataStore` methods using generics by defining an interface that describes your socket data structure:

    ```typescript
    // Define your socket data type
    interface MyStoreType {
        userId: number
        theme: 'light' | 'dark'
        language: string
    }

    @SocketOn("example")
    public example(@SocketData() dataStore: SocketDataStore<MyStoreType>) {
        // ❌ Type error - "unknownKey" is not a valid key of MyStoreType
        dataStore.getData("unknownKey")
        
        // ✅ Correct - "userId" is a valid key
        dataStore.getData("userId") // Returns: number | null
        
        // ❌ Type error - Argument of type 'string' is not assignable to parameter of type 'number'
        dataStore.setData("userId", "not-a-number")
        
        // ✅ Correct - proper type
        dataStore.setData("userId", 123) // ✅ Works correctly
        dataStore.setData("theme", "dark") // ✅ Only 'light' | 'dark' allowed
        dataStore.setData("language", "en") // ✅ String type as expected
    }
    ```

    With typed `SocketDataStore<MyStoreType>`, you get:
    - **Autocompletion**: IDE suggests only valid keys from your interface
    - **Type checking**: Values must match the expected types
    - **Compile-time errors**: Catch mistakes before runtime

2. **Inject a specific data attribute value**

   When used with a key parameter, `@SocketData("key")` directly injects the value of that specific data attribute:

    ```typescript
    @SocketOn("update-theme")
    public updateTheme(@SocketData("theme") currentTheme: string) {
        console.log("Current theme:", currentTheme) // Will be null if not set
    }
    ```

    **Important notes**

    - Socket data attributes are stored per socket connection and persist for the lifetime of that connection
    - When a socket disconnects, all associated data attributes are automatically cleared
    - This is built on top of Socket.IO's native `socket.data` property
    - Data attributes are not shared between different socket connections, even for the same user

### Other decorators

| Decorator | Description                                              |
|-------------------------|----------------------------------------------------------|
| `@UseSocketMiddleware(...ISocketMiddleware[])` | Applies one or more socket middleware to the event handler or controller class. |
| `@SocketNamespace(namespace: string)` | Defines a namespace for a socket controller |
| `@MiddlewareOption(options: MiddlewareOptionType)` | Applies options to a middleware. |
| `@Throttle(limit: number, timeWindowMs: number)` | Applies rate limiting to a controller or event handler. ( [See Rate Limiting](#rate-limiting)) |

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

---

##### @SocketNamespace(namespace: string)

**Equivalent in basic Socket.io:** `io.of(namespace)`

Defines a namespace for a socket controller. All socket events in this controller will be handled within this namespace. Learn more about [Socket.IO namespaces](https://socket.io/docs/v4/namespaces/).

**Usage** :

```typescript
@SocketNamespace("/my-namespace")
export class MyNamespaceController {
    @SocketOn("message")
    public onMessage(@Data() data: MessageRequest) {
        console.log("Message in my-namespace", data.message)
    }
}
```

> [!WARNING]
> The namespace must start with "/" or it will throw a `SiodDecoratorError`.

---

##### @MiddlewareOption(options: MiddlewareOptionType)

Applies options to a middleware.

**Middleware options**

| Property | Type | Description |
|----------|------|-------------|
| [`namespace`](#namespace-middleware) | string | The namespace to which the middleware should be applied. |

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
    import { Event, Socket } from "socket.io"

    export class MySocketMiddleware implements ISocketMiddleware {
        use(socket: Socket, [event, ...args]: Event, next: (err?: Error) => void): void {
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

### Namespace middleware

You can scope a middleware to a specific namespace using the `@MiddlewareOption` decorator. This is particularly useful when using the `@SocketNamespace` decorator to organize your controllers by namespaces.

```typescript
@MiddlewareOption({ namespace: "/orders" })
class OrderMiddleware implements IServerMiddleware {
    public use(socket: Socket, next: (err?: unknown) => void) {
        // This middleware will only be executed for connections to the "/orders" namespace
        console.log("New connection to /orders namespace")
        next()
    }
}
```

In this example:

- The `OrderMiddleware` will only be executed for connections to the "/orders" namespace
- Other namespaces (or the default namespace) will not trigger this middleware
- This works for both Server and Socket middlewares (globally only)

### Error handling middleware

You can create a middleware to handle errors that occur during event handling and above middlewares.

1. **Create an Error Middleware**

    ```typescript
    import { IErrorMiddleware } from "@admandev/socketio-decorator"
    import { Socket } from "socket.io"

    export class MyErrorMiddleware implements IErrorMiddleware{
        handleError (error: any, socket?: Socket) {
            // Handle the error here
            console.log('Error middleware: ', error)
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

## Rate Limiting

You can use rate limiting to control how many requests a client can make within a specific time window. This helps protect your application from abuse and ensures fair resource usage.

### Global Rate Limiting

To enable rate limiting globally for all controllers:

```typescript
useSocketIoDecorator({
    ...,
    throttleConfig: {
        rateLimitConfig: {
            limit: 100,        // Maximum number of requests
            timeWindowMs: 60000 // Time window in milliseconds (1 minute)
        },
        // Optional: cleanup interval for expired throttle data (default: 1 hour)
        cleanupIntervalMs: 3600000,
        // Optional: custom storage implementation
        store: InMemoryThrottleStorage // By default, uses in-memory storage
        getUserIdentifier: (socket) => {
            // Return any unique identifier for the user
            return "By default, it uses the socket id"
        }
    }
})
```

### Class-Level Rate Limiting

Apply rate limiting to all socket events in a controller:

```typescript
@Throttle(10, 60000) // Max 10 requests per minute
class UserController {
    @SocketOn("update-profile")
    public updateProfile() { }

    @SocketOn("change-settings")
    public changeSettings() { }

    @SocketOn("upload-avatar")
    public uploadAvatar() { }
}
```

### Method-Level Rate Limiting

Use the `@Throttle` decorator to apply rate limiting to specific methods:

```typescript
class ChatController {
    @SocketOn("message")
    @Throttle(5, 1000) // Max 5 requests per second
    public sendMessage(@Data() message: string) {
        console.log("Message received:", message)
    }
}
```

### Priority and Scope

Rate limiting follows a hierarchy where more specific configurations override broader ones:

1. **Method-level** (Highest Priority): `@Throttle` decorator on individual methods
2. **Class-level** (Medium Priority): `@Throttle` decorator on controller classes  
3. **Global** (Lowest Priority): `throttleConfig` in `useSocketIoDecorator`

```typescript
// Global configuration (lowest priority)
useSocketIoDecorator({
    throttleConfig: {
        rateLimitConfig: { limit: 100, timeWindowMs: 60000 }
    }
})

// Class-level configuration (medium priority)
@Throttle(20, 60000) // Overrides global config for this controller
class ChatController {
    
    @SocketOn("message")
    public sendMessage() {
        // Uses class-level: 20 requests per minute
    }

    @SocketOn("upload")
    @Throttle(5, 300000) // Method-level (highest priority)
    public uploadFile() {
        // Uses method-level: 5 requests per 5 minutes
        // Overrides both class and global configs
    }
}
```

### Custom User Identification

By default, rate limiting uses the socket ID to identify clients. However, since socket IDs change when users reconnect, you might want to use a more persistent identifier (e.g., user ID, session ID). You can configure this through the `getUserIdentifier` option:

```typescript
useSocketIoDecorator({
    throttleConfig: {
       ...,
        // Custom user identification function
        getUserIdentifier: (socket) => {
            return "Return any unique identifier for the user"
        }
    }
})
```

The `getUserIdentifier` function:

- Receives the socket instance as parameter
- Should return a string or Promise

### Error Handling

Rate limit errors are thrown as `SiodThrottleError`. Handle them using an [error middleware](#error-handling-middleware):

```typescript
class ErrorMiddleware implements IErrorMiddleware {
    handleError(error: unknown) {
        if (error instanceof SiodThrottleError) {
            console.error("Rate limit exceeded. Retry in:", error.remainingTime, "ms")
        }
    }
}
```

### Important Notes

- Rate limits are applied per client ID
- Each event has its own independent rate limit counter
- Class-level rate limits can be overridden by method-level decorators
- Global configuration applies to all controllers without explicit `@Throttle` decorators
- Rate limit data is automatically cleaned up based on `cleanupIntervalMs`

### Custom Storage Implementation

By default, rate limiting data is stored in memory using `InMemoryThrottleStorage`. However, you can implement your own storage solution (e.g., Redis, Database) by implementing the `IThrottleStorage` interface.

Example implementation using Redis:

```typescript
class RedisThrottleStorage implements IThrottleStorage {
    private static readonly redis = new Redis("You url")
    private readonly prefix = "throttle"

    // Get the throttle entry for a specific client and event
    public async get(clientId: string, event: string): Promise<ThrottleEntry | undefined> {
        try {
            const key = this.getKey(clientId, event)
            const data = await RedisThrottleStore.redis.get(key)

            if (!data) {
                return undefined
            }

            return JSON.parse(data) as ThrottleEntry
        } catch (error) {
            console.error("Redis get error:", error)
            return undefined
        }
    }

    // Set / update the throttle entry for a specific client and event
    public async set(clientId: string, event: string, entry: ThrottleEntry): Promise<void> {
        try {
            const key = this.getKey(clientId, event)
            const ttl = Math.max(0, entry.resetTime - Date.now()) // in ms

            // Save the entry with automatic expiration
            if (ttl > 0) {
                await RedisThrottleStore.redis.set(key, JSON.stringify(entry), "PX", ttl)
            }
        } catch (error) {
            console.error("Redis set error:", error)
        }
    }

    // Cleanup method to remove expired entries
    public async cleanup(): Promise<void> {
        // Redis handles expiration automatically with TTL → nothing to do here.
        // But we can flush if needed (optional)
        // await this.redis.flushall()
        return Promise.resolve()
    }

    private getKey(clientId: string, event: string): string {
        return `${this.prefix}:${clientId}:${event}`
    }
}
```

Then configure it in your application:

```typescript
useSocketIoDecorator({
    ...,
    throttleConfig: {
        store: RedisThrottleStorage // Your custom storage class
    }
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

## Application Events

Application events provide an internal event bus for cross-service / class communication within your server. Unlike Socket.IO events that communicate over the network, application events are server-side only and enable decoupled communication between different parts of your application.

### Why use Application Events?

Application events are particularly useful for:

- **Cross-Service communication**: Enable different services to communicate without direct references (e.g., OrderController notifying InventoryService and NotificationService)

- **Decoupled architecture**: Create loosely coupled components that can interact through events

- **Event-driven actions**: Trigger application-wide actions when Socket.IO events occur (e.g., emit an app event after processing a socket message)

### How It Works

The Application Events system uses two main decorators:

| Decorator  | Description |
|-----------|-------------|
| `@AppOn(eventName: string)` | Registers a method as an application event listener |
| `@AppEmit(eventName: string)` | Emits an application event when a method executes |

When an event is emitted, all registered listeners for that event are called asynchronously with an `AppEventContext` object containing the event details.

**How to use them?**

#### `@AppOn(eventName: string)`

**Description**: Registers a method as an application event listener

**Method signature**: `(context: AppEventContext) => unknown | Promise<unknown>`

**Usage**:

1. **Create a class with the event listener**

    ```typescript
    type OrderData = {
        orderId: string
        items: OrderItem[]
        total: number
        createdAt: Date
    }

    // App event listener that responds to order creation
    class InventoryService {
        @AppOn("order-created")
        public updateInventory(context: AppEventContext) {
            const order = context.data as OrderData
                    
            // Inventory update logic
        }
    }

    // Another listener for the same event
    class NotificationService {
        @AppOn("order-created")
        public notifyWarehouse(context: AppEventContext) {
            const order = context.data as OrderData

            // Available when the event is triggered from a socket handler
            const socket = context.ioContext?.currentSocket
            
            // Warehouse notification logic
        }
    }
    ```

2. **Register them in the `useSocketIoDecorator` config**

    ```typescript
    useSocketIoDecorator({
        ...,
        appEventListeners: [InventoryService, NotificationService]
    })
    ```

**Key features**:

- Multiple listeners can subscribe to the same event
- Listeners execute independently and asynchronously
- Method receives an `AppEventContext` object with event details

---

#### `@AppEmit(eventName: string)`

**Description**: Emits an application event when the decorated method executes

**Usage**:

```typescript
// Emits from a Socket.IO listener
class OrderController {
    @SocketOn("create-order")
    @AppEmit("order-created")
    public createOrder(@Data() orderData: any) {
        console.log("Creating order from socket event")
        
        // Order creation logic
        const order: OrderData = {
            orderId: "ORD-123",
            items: orderData.items,
            total: orderData.total,
            createdAt: new Date()
        }
        
        // This return value becomes the data available in listeners context
        return order
    }
}

// Emits from a simple class method
class OrderService {
    @AppEmit("order-created")
    public createOrder(orderData: any) {
        console.log("Creating order from service")
        
        // Order creation logic
        const order = ...
        
        // This return value becomes the data available in listeners context
        return order
    }
}
```

Note: No need to register the event emitters in the `useSocketIoDecorator` config.

**Key features**:

- Method's return value becomes the event data in listeners context
- Can be combined with Socket.IO decorators
- Can be used with any class method
- Event is emitted to all registered listeners

### AppEventContext Interface

The `AppEventContext` object passed to event listeners contains:

| Property | Type | Description |
|----------|------|-------------|
| `eventName` | `string` | The name of the application event that triggered the listener |
| `data` | `unknown` | The data associated with the event (return value from `@AppEmit` method) |
| `ioContext` | `object` (optional) | Socket.IO context when event is triggered from a socket handler |

**`ioContext` properties** (when available):

| Property | Type | Description |
|----------|------|-------------|
| `currentSocket` | `Socket \| null` | The current Socket.IO socket instance |
| `eventName` | `string` | The original Socket.IO event name |
| `eventData` | `unknown[]` | The original Socket.IO event arguments |

### Important Notes

- **Server-side only**: Application Events are internal to your server and don't communicate over the network

- **Asynchronous execution**: Listeners execute independently and asynchronously

- **No execution order guarantee**: The order in which multiple listeners execute is not guaranteed

- **Error isolation**: Errors in one listener don't affect the emitter or other listeners

- **Error handling**: ErrorMiddleware is not applied to app event listeners - you must handle errors within your listener methods

## Hooks

Hooks in Socketio Decorator are functions that provides some data.

### UseIoServer hook

The `useIoServer` is the simpliest hook that provides the `io` socketio server object.

```typescript
import { useIoServer } from "@admandev/socketio-decorator"
import { Server } from "socket.io"

const io: Server = useIoServer()
```

---

### UseUserSocket hook

The `useUserSocket` hook allows you to retrieve a specific connected socket instance based on a search argument (e.g., user ID).

1. **Setup the `searchUserSocket` function**

   In the `app.ts` file, provide a function that searches for a user socket based on an argument:

    ```typescript
    useSocketIoDecorator({
        ...,
        // Here we decide that the search argument is the user ID but you can use any other argument type
        searchUserSocket: async (userId: string) => {
            const allSockets = Array.from(io.sockets.sockets.values())
            return allSockets.find(socket => socket.user.id === userId) || null
        },
    })
    ```

2. **Use the `useUserSocket` hook anywhere**

    ```typescript
    import { useUserSocket } from "@admandev/socketio-decorator"
    import { Socket } from "socket.io"

    const userSocket: Socket | null = await useUserSocket(userId)
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
