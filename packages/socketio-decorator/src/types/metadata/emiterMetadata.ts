import { Metadata } from "./metadata"

export type EmitterMetadata = Metadata & {
	to: string
	message: string
}