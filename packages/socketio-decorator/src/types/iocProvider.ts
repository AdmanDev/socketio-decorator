import { ClassConstructorType } from "./classConstructorType"

export type IoCProvider = {
	get<T>(type: ClassConstructorType<T>): T;
}