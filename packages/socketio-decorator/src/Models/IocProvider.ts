import { ClassConstructorType } from "./ClassConstructorType"

export type IoCProvider = {
	get<T>(type: ClassConstructorType<T>): T;
}