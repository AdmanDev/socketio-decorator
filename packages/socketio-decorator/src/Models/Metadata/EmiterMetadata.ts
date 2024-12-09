import { Metadata } from "./Metadata"

export type EmitterMetadata = Metadata & {
	to: string
	message: string
}