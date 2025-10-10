import { AppEventContext, AppOn } from "@admandev/socketio-decorator"
import type { Order } from "../models/order"

export class InventoryEventService {
    @AppOn("order-created")
    public updateInventory(context: AppEventContext) {
        // Get the order data from the context
        const order = context.data as Order

        // Inventory update logic
        console.log("Inventory updated for order ", order.orderId)
    }
}
