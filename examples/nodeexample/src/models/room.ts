export interface Member {
    id: string
    name: string
}

export type Room = {
    name: string
    members: Member[]
}