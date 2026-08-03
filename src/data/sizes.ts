/**
 * Israeli ring sizing. In Israel (as across Europe) a ring "מידה" is the inner
 * DIAMETER in millimetres; circumference follows as π × diameter.
 */
export type RingSize = {
  /** Israeli/European size — inner diameter in mm. */
  size: string;
  /** Inner circumference in mm, rounded. */
  circumference: number;
};

export const ringSizes: RingSize[] = [
  { size: '14', circumference: 44 },
  { size: '15', circumference: 47 },
  { size: '16', circumference: 50 },
  { size: '17', circumference: 53 },
  { size: '18', circumference: 57 },
  { size: '19', circumference: 60 },
  { size: '20', circumference: 63 },
  { size: '21', circumference: 66 },
  { size: '22', circumference: 69 },
];

/** Chain lengths offered for necklaces, in cm. */
export const necklaceLengths = ['40 ס"מ', '42 ס"מ', '45 ס"מ', '50 ס"מ'];

/** Bracelet lengths, in cm. */
export const braceletLengths = ['16 ס"מ', '17 ס"מ', '18 ס"מ', '19 ס"מ'];
