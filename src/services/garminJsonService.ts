export interface GarminWorkoutStep {
  distanceMeters: number;
  targetPaceSec: number; // seconds per km
  label: string;
}

const SPORT_TYPE = { sportTypeId: 1, sportTypeKey: 'running', displayOrder: 1 };

const STROKE_TYPE  = { strokeTypeId: 0, strokeTypeKey: null, displayOrder: 0 };
const EQUIP_TYPE   = { equipmentTypeId: 0, equipmentTypeKey: null, displayOrder: 0 };
const WEIGHT_UNIT  = { unitId: 8, unitKey: 'kilogram', factor: 1000.0 };
const KM_UNIT      = { unitId: 2, unitKey: 'kilometer', factor: 100000.0 };

const END_CONDITION_DISTANCE = {
  conditionTypeId: 3,
  conditionTypeKey: 'distance',
  displayOrder: 3,
  displayable: true,
};

const TARGET_PACE_ZONE = {
  workoutTargetTypeId: 6,
  workoutTargetTypeKey: 'pace.zone',
  displayOrder: 6,
};

function makeStep(step: GarminWorkoutStep, index: number): object {
  const speedMs = step.targetPaceSec > 0 ? 1000 / step.targetPaceSec : 0;
  // targetValueOne = faster bound (higher speed), targetValueTwo = slower bound
  const faster = speedMs * 1.05;
  const slower = speedMs * 0.95;

  return {
    type: 'ExecutableStepDTO',
    stepId: Date.now() + index * 1000 + Math.floor(Math.random() * 1000),
    stepOrder: index,
    stepType: { stepTypeId: 3, stepTypeKey: 'interval', displayOrder: 3 },
    childStepId: null,
    description: step.label,
    endCondition: END_CONDITION_DISTANCE,
    endConditionValue: step.distanceMeters,
    preferredEndConditionUnit: KM_UNIT,
    endConditionCompare: null,
    targetType: TARGET_PACE_ZONE,
    targetValueOne: faster,
    targetValueTwo: slower,
    targetValueUnit: null,
    zoneNumber: null,
    secondaryTargetType: null,
    secondaryTargetValueOne: null,
    secondaryTargetValueTwo: null,
    secondaryTargetValueUnit: null,
    secondaryZoneNumber: null,
    endConditionZone: null,
    strokeType: STROKE_TYPE,
    equipmentType: EQUIP_TYPE,
    category: null,
    exerciseName: null,
    workoutProvider: null,
    providerExerciseSourceId: null,
    weightValue: null,
    weightUnit: WEIGHT_UNIT,
  };
}

export function generateGarminJson(
  workoutName: string,
  steps: GarminWorkoutStep[],
  totalTimeSec: number,
  totalDistanceM: number,
): object {
  const now = new Date().toISOString().replace('Z', '.0');
  const avgSpeedMs = totalTimeSec > 0 ? totalDistanceM / totalTimeSec : 0;

  const workoutSteps = steps.map((s, i) => makeStep(s, i + 1));

  return {
    workoutId: 0,
    ownerId: 0,
    workoutName,
    description: null,
    updatedDate: now,
    createdDate: now,
    sportType: SPORT_TYPE,
    subSportType: 'GENERIC',
    trainingPlanId: null,
    author: null,
    sharedWithUsers: null,
    estimatedDurationInSecs: Math.round(totalTimeSec),
    estimatedDistanceInMeters: totalDistanceM,
    workoutSegments: [
      {
        segmentOrder: 1,
        sportType: SPORT_TYPE,
        poolLengthUnit: null,
        poolLength: null,
        avgTrainingSpeed: null,
        estimatedDurationInSecs: null,
        estimatedDistanceInMeters: null,
        estimatedDistanceUnit: null,
        estimateType: null,
        description: null,
        workoutSteps,
      },
    ],
    poolLength: null,
    poolLengthUnit: null,
    locale: null,
    workoutProvider: null,
    workoutSourceId: null,
    uploadTimestamp: null,
    atpPlanId: null,
    consumer: null,
    consumerName: null,
    consumerImageURL: null,
    consumerWebsiteURL: null,
    workoutNameI18nKey: null,
    descriptionI18nKey: null,
    avgTrainingSpeed: avgSpeedMs,
    estimateType: null,
    estimatedDistanceUnit: { unitId: null, unitKey: null, factor: null },
    workoutThumbnailUrl: null,
    isSessionTransitionEnabled: null,
    shared: false,
  };
}
