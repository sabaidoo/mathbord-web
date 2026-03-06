export interface SubjectCategory {
  title: string;
  subjects: string[];
}

export interface ProvinceData {
  name: string;
  categories: SubjectCategory[];
}

export const SUBJECT_DATA: Record<string, ProvinceData> = {
  ON: {
    name: 'Ontario',
    categories: [
      { title:'Elementary (Grades 1\u20136)', subjects:['Number Sense & Numeration','Measurement','Geometry & Spatial Sense','Patterning & Algebra','Data Management & Probability'] },
      { title:'Middle School (Grades 7\u20138)', subjects:['Number Sense & Numeration 7/8','Proportional Reasoning','Algebraic Thinking','Geometry & Measurement 7/8','Data Literacy & Probability'] },
      { title:'Grade 9\u201310', subjects:['MTH1W De-streamed Math 9','MPM2D Principles of Math 10','MFM2P Foundations of Math 10','Linear Relations','Quadratic Functions','Analytic Geometry','Trigonometry'] },
      { title:'Grade 11\u201312', subjects:['MCR3U Functions 11','MCF3M Functions & Applications','MHF4U Advanced Functions','MCV4U Calculus & Vectors','MDM4U Data Management','MAP4C College Math'] },
    ]
  },
  BC: {
    name: 'British Columbia',
    categories: [
      { title:'Elementary (K\u20137)', subjects:['Number Concepts','Computational Fluency','Patterning','Geometry','Data & Probability'] },
      { title:'Grade 8\u20139', subjects:['Workplace Math 8/9','Math 8','Math 9','Proportional Reasoning','Linear Relations','Spatial Reasoning'] },
      { title:'Grade 10', subjects:['Foundations & Pre-Calculus 10','Workplace Math 10','Financial Literacy','Trigonometry & Geometry'] },
      { title:'Grade 11\u201312', subjects:['Pre-Calculus 11','Foundations 11','Pre-Calculus 12','Calculus 12','Statistics 12','Workplace Math 11'] },
    ]
  },
  AB: {
    name: 'Alberta',
    categories: [
      { title:'Elementary (K\u20136)', subjects:['Number','Patterns & Relations','Shape & Space','Statistics & Probability'] },
      { title:'Junior High (7\u20139)', subjects:['Math 7','Math 8','Math 9','Number Operations','Linear Relations','Geometry'] },
      { title:'Senior High (10\u201312)', subjects:['Math 10C','Math 10-3','Math 20-1','Math 20-2','Math 30-1','Math 30-2','Math 31 (Calculus)'] },
    ]
  },
  QC: {
    name: 'Quebec',
    categories: [
      { title:'Primary (Grades 1\u20136)', subjects:['Arithmetic','Geometry','Measurement','Statistics & Probability'] },
      { title:'Secondary (Sec 1\u20135)', subjects:['Secondary 1 Math','Secondary 2 Math','Secondary 3 Math','Secondary 4 CST','Secondary 4 TS/SN','Secondary 5 CST','Secondary 5 TS/SN'] },
      { title:'CEGEP', subjects:['Calculus I (NYA)','Calculus II (NYB)','Linear Algebra (NYC)','Statistics','Probability'] },
    ]
  },
  MB: {
    name: 'Manitoba',
    categories: [
      { title:'Elementary\u2013Middle (K\u20138)', subjects:['Number Sense','Patterns & Relations','Shape & Space','Statistics & Probability'] },
      { title:'Senior Years (9\u201312)', subjects:['Introduction to Applied & Pre-Calculus Math','Applied Math 9\u201312','Pre-Calculus Math 9\u201312','Essential Math 9\u201312'] },
    ]
  },
  SK: {
    name: 'Saskatchewan',
    categories: [
      { title:'Elementary\u2013Middle (K\u20139)', subjects:['Number','Patterns & Relations','Shape & Space','Statistics & Probability'] },
      { title:'Senior (10\u201312)', subjects:['Foundations & Pre-Calculus 10','Workplace & Apprenticeship 10','Pre-Calculus 20/30','Foundations 20/30','Calculus 30'] },
    ]
  },
  NS: {
    name: 'Nova Scotia',
    categories: [
      { title:'Elementary\u2013Junior High (P\u20139)', subjects:['Number','Patterns & Relations','Geometry','Data Analysis & Probability'] },
      { title:'Senior High (10\u201312)', subjects:['Math Foundations 10','Math Academic 10','Math 11 Academic','Math 11 at Work','Pre-Calculus 12','Calculus 12','Math at Work 12'] },
    ]
  },
  NB: {
    name: 'New Brunswick',
    categories: [
      { title:'K\u20138', subjects:['Number Sense','Patterns & Relations','Geometry','Data Management'] },
      { title:'High School (9\u201312)', subjects:['Math 9','Foundations & Pre-Calculus 10','Pre-Calculus 11/12','Foundations 11/12','Calculus 120'] },
    ]
  },
  NL: {
    name: 'Newfoundland & Labrador',
    categories: [
      { title:'K\u20139', subjects:['Number','Patterns & Relations','Shape & Space','Statistics & Probability'] },
      { title:'Senior High (10\u201312)', subjects:['Academic Math 1201/2201/3201','Applied Math 1202/2202','Advanced Math 3200','Calculus 3208'] },
    ]
  },
  PE: {
    name: 'Prince Edward Island',
    categories: [
      { title:'K\u20139', subjects:['Number Sense','Patterns & Algebra','Geometry & Measurement','Data Analysis'] },
      { title:'Senior High (10\u201312)', subjects:['Math 421A/521A','Pre-Calculus 11/12','Foundations 11/12','Calculus 621B'] },
    ]
  },
  UNI: {
    name: 'University / College',
    categories: [
      { title:'First Year', subjects:['Calculus I (Differential)','Calculus II (Integral)','Linear Algebra I','Introduction to Probability','Introduction to Statistics','Discrete Mathematics','Mathematical Proofs'] },
      { title:'Second Year', subjects:['Multivariable Calculus (Calculus III)','Ordinary Differential Equations','Linear Algebra II','Real Analysis I','Numerical Methods','Mathematical Statistics'] },
      { title:'Upper Year / Graduate', subjects:['Abstract Algebra','Real Analysis II','Complex Analysis','Partial Differential Equations','Topology','Number Theory','Stochastic Processes','Operations Research'] },
      { title:'Applied / Professional', subjects:['Engineering Mathematics','Actuarial Mathematics','Financial Mathematics','Biostatistics','Econometrics','Mathematical Modelling','Optimization'] },
    ]
  },
  IB: {
    name: 'IB Programme',
    categories: [
      { title:'IB Mathematics', subjects:['Math AA SL (Analysis & Approaches)','Math AA HL','Math AI SL (Applications & Interpretation)','Math AI HL','IB Internal Assessment (IA)','IB Exam Prep'] },
    ]
  },
  AP: {
    name: 'AP Programme',
    categories: [
      { title:'AP Mathematics', subjects:['AP Pre-Calculus','AP Calculus AB','AP Calculus BC','AP Statistics','AP Exam Prep'] },
    ]
  },
  EXAM: {
    name: 'Standardized Test Prep',
    categories: [
      { title:'College Admissions', subjects:['SAT Math','PSAT / NMSQT Math','ACT Math','SSAT Math (Middle/Upper)'] },
      { title:'Graduate Admissions', subjects:['GRE Quantitative','GMAT Quantitative','MCAT (Quantitative sections)'] },
      { title:'Professional / Other', subjects:['Canadian Math Competitions (AMC, Cayley, Fermat, Euclid)','MATHCOUNTS / Math Olympiad','Actuarial Exam P / FM'] },
    ]
  },
};
