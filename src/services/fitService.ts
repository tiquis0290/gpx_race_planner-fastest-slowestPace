// Minimal FIT file writer for workout data
// Based on FIT Protocol specification

const FIT_PROTOCOL_VERSION = 0x10;
const FIT_PROFILE_VERSION = 2132;

const MESG_FILE_ID = 0;
const MESG_WORKOUT = 26;
const MESG_WORKOUT_STEP = 27;

const FIT_UINT16 = 0x84;
const FIT_UINT32 = 0x86;
const FIT_STRING = 0x07;
const FIT_ENUM = 0x00;

function crc16(data: Uint8Array, crc = 0): number {
  const table = [
    0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
    0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
  ];
  for (const byte of data) {
    let tmp = table[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    crc = crc ^ tmp ^ table[byte & 0xF];
    tmp = table[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    crc = crc ^ tmp ^ table[(byte >> 4) & 0xF];
  }
  return crc;
}

class FitWriter {
  private records: number[] = [];

  private writeDefinitionRecord(
    localMsgNum: number,
    globalMsgNum: number,
    fields: { fieldNum: number; size: number; baseType: number }[]
  ) {
    this.records.push(0x40 | localMsgNum);
    this.records.push(0x00);
    this.records.push(0x00);
    this.records.push(globalMsgNum & 0xFF);
    this.records.push((globalMsgNum >> 8) & 0xFF);
    this.records.push(fields.length);
    for (const f of fields) {
      this.records.push(f.fieldNum);
      this.records.push(f.size);
      this.records.push(f.baseType);
    }
  }

  private writeDataRecord(localMsgNum: number, values: (number | number[])[]) {
    this.records.push(localMsgNum & 0x0F);
    for (const val of values) {
      if (Array.isArray(val)) {
        for (const b of val) this.records.push(b & 0xFF);
      } else {
        this.records.push(val & 0xFF);
      }
    }
  }

  private u16(v: number): number[] {
    return [v & 0xFF, (v >> 8) & 0xFF];
  }

  private u32(v: number): number[] {
    return [v & 0xFF, (v >> 8) & 0xFF, (v >> 16) & 0xFF, (v >> 24) & 0xFF];
  }

  writeFileId() {
    this.writeDefinitionRecord(0, MESG_FILE_ID, [
      { fieldNum: 0, size: 1, baseType: FIT_ENUM },
      { fieldNum: 4, size: 2, baseType: FIT_UINT16 },
      { fieldNum: 5, size: 2, baseType: FIT_UINT16 },
      { fieldNum: 8, size: 4, baseType: FIT_UINT32 },
    ]);
    const now = Math.floor(Date.now() / 1000) - 631065600;
    this.writeDataRecord(0, [5, ...this.u16(1), ...this.u16(0), ...this.u32(now)]);
  }

  writeWorkout(name: string, numSteps: number) {
    this.writeDefinitionRecord(1, MESG_WORKOUT, [
      { fieldNum: 4, size: 2, baseType: FIT_UINT16 },
      { fieldNum: 8, size: 16, baseType: FIT_STRING },
      { fieldNum: 254, size: 2, baseType: FIT_UINT16 },
    ]);
    const nameBytes = new Array(16).fill(0);
    for (let i = 0; i < Math.min(name.length, 15); i++) {
      nameBytes[i] = name.charCodeAt(i);
    }
    this.writeDataRecord(1, [...this.u16(numSteps), ...nameBytes, ...this.u16(0)]);
  }

  writeWorkoutStep(
    stepIndex: number,
    stepName: string,
    durationValue: number,
    targetSpeedLow: number,
    targetSpeedHigh: number
  ) {
    this.writeDefinitionRecord(2, MESG_WORKOUT_STEP, [
      { fieldNum: 0, size: 16, baseType: FIT_STRING },
      { fieldNum: 2, size: 1, baseType: FIT_ENUM },
      { fieldNum: 3, size: 4, baseType: FIT_UINT32 },
      { fieldNum: 4, size: 1, baseType: FIT_ENUM },
      { fieldNum: 5, size: 4, baseType: FIT_UINT32 },
      { fieldNum: 6, size: 4, baseType: FIT_UINT32 },
      { fieldNum: 7, size: 4, baseType: FIT_UINT32 },
      { fieldNum: 254, size: 2, baseType: FIT_UINT16 },
    ]);
    const nameBytes = new Array(16).fill(0);
    const label = stepName.substring(0, 15);
    for (let i = 0; i < label.length; i++) {
      nameBytes[i] = label.charCodeAt(i);
    }
    const durationCm = Math.round(durationValue * 100);
    this.writeDataRecord(2, [
      ...nameBytes,
      1,
      ...this.u32(durationCm),
      0,
      ...this.u32(0),
      ...this.u32(targetSpeedLow),
      ...this.u32(targetSpeedHigh),
      ...this.u16(stepIndex),
    ]);
  }

  build(): Uint8Array {
    const dataBytes = new Uint8Array(this.records);
    const dataCrc = crc16(dataBytes);

    const header = new Uint8Array(14);
    const hv = new DataView(header.buffer);
    hv.setUint8(0, 14);
    hv.setUint8(1, FIT_PROTOCOL_VERSION);
    hv.setUint16(2, FIT_PROFILE_VERSION, true);
    hv.setUint32(4, dataBytes.length, true);
    header[8] = 0x2E; header[9] = 0x46; header[10] = 0x49; header[11] = 0x54;
    const headerCrc = crc16(header.slice(0, 12));
    hv.setUint16(12, headerCrc, true);

    const result = new Uint8Array(14 + dataBytes.length + 2);
    result.set(header, 0);
    result.set(dataBytes, 14);
    const rv = new DataView(result.buffer);
    rv.setUint16(14 + dataBytes.length, dataCrc, true);
    return result;
  }
}

export interface WorkoutStep {
  name: string;
  distanceMeters: number;
  targetPaceSec: number;
}

export function generateFitWorkout(workoutName: string, steps: WorkoutStep[]): Uint8Array {
  const writer = new FitWriter();
  writer.writeFileId();
  writer.writeWorkout(workoutName, steps.length);
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const speedMs = step.targetPaceSec > 0 ? 1000 / step.targetPaceSec : 0;
    const tol = 0.05;
    const lowMms = Math.round(speedMs * (1 - tol) * 1000);
    const highMms = Math.round(speedMs * (1 + tol) * 1000);
    writer.writeWorkoutStep(i, step.name, step.distanceMeters, lowMms, highMms);
  }
  return writer.build();
}
