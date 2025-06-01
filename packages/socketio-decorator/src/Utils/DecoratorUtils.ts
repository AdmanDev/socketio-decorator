import { ClassDecoratorTarget, MethodDecoratorTarget } from "../Models/Utilities/DecoratorUtilityTypes"

/**
 * Utilities for decorators
 */
export class DecoratorUtils {
	/**
	 * Determines if the provided arguments correspond to a class decorator.
	 * @param {unknown[]} args - The arguments to check.
	 * @returns {args is ClassDecoratorTarget} - Returns true if the arguments are valid for a class decorator.
	 */
	public static isClassDecorator (args: unknown[]): args is ClassDecoratorTarget {
		return args.length === 1 && typeof args[0] === "function"
	}

	/**
	 * Determines if the provided arguments correspond to a method decorator.
	 * @param {unknown[]} args - The arguments to check.
	 * @returns {args is MethodDecoratorTarget} - Returns true if the arguments are valid for a method decorator.
	 */
	public static isMethodDecorator (args: unknown[]): args is MethodDecoratorTarget {
		return (
			args.length === 3 &&
            typeof args[0] === "object" &&
            (typeof args[1] === "string" || typeof args[1] === "symbol") &&
            typeof args[2] === "object"
		)
	}
}