export type RoomOption = {
  id: number;
  schoolId: number;
  schoolBranchId?: number | null;
  name: string;
  building?: string | null;
  floor?: number | null;
  capacity?: number | null;
  status: string;
  notes?: string | null;
  displayName: string;
  classesCount?: number;
};

export function roomLabel(room: Pick<RoomOption, "displayName" | "name" | "building">): string {
  return room.displayName ?? (room.building ? `${room.building} — ${room.name}` : room.name);
}

/** @deprecated use roomLabel */
export const classRoomLabel = roomLabel;

export type ClassRoomOption = RoomOption;
