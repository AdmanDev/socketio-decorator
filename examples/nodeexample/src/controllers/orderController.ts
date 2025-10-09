import { AppEmit, SocketOn } from "@admandev/socketio-decorator"
import type { Order } from "../models/order"
import { InventoryEventService } from "../appEvent/inventoryEventService"
import { OrderNotificationEventService } from "../appEvent/orderNotificationEventService"

export class OrderController {
    @SocketOn("create-order")
    @AppEmit("order-created")
    public createOrder() {
        console.log("Starting order creation")

        const order: Order = {
            orderId: "123",
            items: ["Mug", "Shirt"],
            total: 100,
            createdAt: new Date()
        }

        return order
    }
}