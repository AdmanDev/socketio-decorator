import { ClassConstructorType } from "./ClassConstructorType"

export type IoCProvider = {
	get<T>(type: ClassConstructorType<T>): T
	set<T>(type: ClassConstructorType<T>, instance: T): void
}