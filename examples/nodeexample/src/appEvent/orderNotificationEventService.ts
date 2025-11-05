import { AppEventContext, AppOn } from "@admandev/socketio-decorator";
import type { Order } from "../models/order";

export class OrderNotificationEventService {
    @AppOn("order-created")
    public notifyWarehouse(context: AppEventContext) {
        const order = context.data as Order

        // Warehouse notification logic
        console.log("Warehouse notified for order ", order.orderId)
    }
}