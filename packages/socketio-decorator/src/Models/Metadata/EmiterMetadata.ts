import { IoMappingMetadata } from "./Metadata"

export type EmitterMetadata = IoMappingMetadata & {
	to: string
	message: string
}