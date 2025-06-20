import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator"

/**
 * Defines the message data
 */
export class MessageData {
	@IsString()
	@IsNotEmpty()
	public message = ""
}

/**
 * Defines the user data
 */
export class UserData {
	@IsString()
	@IsNotEmpty()
	public username = ""

	@IsNumber()
	@IsPositive()
	public age = 0
}