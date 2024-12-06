import { IsNotEmpty, IsString } from "class-validator"

/**
 * Defines the message data
 */
export class MessageData {
	@IsString()
	@IsNotEmpty()
	public message = ""
}