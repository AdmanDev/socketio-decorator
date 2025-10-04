import { config } from "../../globalMetadata"
import { EventFuncProxyType } from "../../Models/EventFuncProxyType"
import { ControllerMetadata } from "../../Models/Metadata/Metadata"
import { ThrottleMetadata } from "../../Models/Metadata/ThrottleMetadata"
import { Wrapper } from "../WrapperCore/Wrapper"
import { ThrottleManager } from "./ThrottleManager"

/**
 * Defines a wrapper to apply throttle on event handlers.
 */
export class ThrottleWrapper extends Wrapper {
	/** @inheritdoc */
	public execute (metadata: ControllerMetadata) {
		if (config.throttleConfig?.rateLimitConfig && !metadata.throttleMetadata) {
			metadata.throttleMetadata = {
				target: metadata.controllerTarget,
				limit: config.throttleConfig.rateLimitConfig.limit,
				timeWindowMs: config.throttleConfig.rateLimitConfig.timeWindowMs
			}
		}

		const throttleMetadata = metadata.methodMetadata.map(m => m.metadata.throttleMetadata).filter(m => m !== undefined)
		this.addMethodThrottle(throttleMetadata, metadata.controllerInstance)
		this.addClassThrottle(metadata)
	}

	/**
	 * Adds method throttle to the controller instance methods.
	 * @param {ThrottleMetadata[]} metadata - Array of metadata for the methods to be throttled.
	 * @param {any} controllerInstance - The target controller instance containing the methods to wrap.
	 */
	private addMethodThrottle (metadata: ThrottleMetadata[], controllerInstance: Any) {
		metadata.forEach((m) => {
			this.wrapMethod(m, controllerInstance)
		})
	}

	/**
	 * Adds class throttle to all applicable handlers of a controller class.
	 * @param {ControllerMetadata} metadata - The controller metadata containing the class throttle info.
	 */
	private addClassThrottle (metadata: ControllerMetadata) {
		const { controllerInstance, methodMetadata, throttleMetadata } = metadata

		if (!throttleMetadata) {
			return
		}

		const methodNames: string[] = methodMetadata
			.filter(method => {
				const listeners = method.metadata.ioMetadata.listenerMetadata
				const throttleMetadata = method.metadata.throttleMetadata
				return listeners.length > 0
					&& !listeners.some(lm => lm.type === "server")
					&& !throttleMetadata
			})
			.map(method => method.metadata.ioMetadata.listenerMetadata[0].methodName)

		methodNames.forEach(methodName => {
			const metadata: ThrottleMetadata = {
				target: controllerInstance.constructor,
				limit: throttleMetadata.limit,
				timeWindowMs: throttleMetadata.timeWindowMs,
				methodName
			}
			this.wrapMethod(metadata, controllerInstance)
		})
	}

	/**
	 * Wraps a controller method with throttle logic.
	 * @param {ThrottleMetadata} metadata - Metadata associated with the throttle to be applied.
	 * @param {any} controllerInstance - The target controller instance containing the method to wrap.
	 */
	private wrapMethod (metadata: ThrottleMetadata, controllerInstance: Any) {
		const methodName = metadata.methodName
		const method = controllerInstance[methodName]

		const throttleProxy: EventFuncProxyType = async function (proxyArgs) {
			const { socket, eventName } = proxyArgs
			if (!socket) {
				return method.apply(controllerInstance, [proxyArgs])
			}

			await ThrottleManager.checkThrottle(socket, eventName, metadata.limit, metadata.timeWindowMs)
			return method.apply(controllerInstance, [proxyArgs])
		}

		controllerInstance[methodName] = throttleProxy
	}
}