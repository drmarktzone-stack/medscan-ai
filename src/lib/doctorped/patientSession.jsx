import React, { createContext, useContext, useMemo, useState } from 'react';
import { parseAgeParts } from '../clinic/ageParts.js';

const PatientSessionContext = createContext(null);

const empty = {
  ageYears: '',
  ageMonths: '',
  ageDays: '',
  sex: '',
  weight: '',
  height: '',
  gaWeeks: '',
  gcs: '',
  fatherCm: '',
  motherCm: '',
  presentation: '',
  findingsText: '',
  features: {},
  patientName: '',
  nationalId: '',
  phone: '',
  temp: '',
  hr: '',
  rr: '',
  bpSys: '',
  bpDia: '',
  spo2: '',
  pain: '',
  exam: {},
  diagnoses: [],
  orders: { labs: [], imaging: [], consults: [] },
  workupStepId: null,
};

export function buildPatient(session) {
  const patient = { ...parseAgeParts(session) };
  if (session.sex) patient.sex = session.sex;
  if (session.weight !== '') patient.weight_kg = Number(session.weight);
  if (session.height !== '') patient.height_cm = Number(session.height);
  if (session.gaWeeks !== '') patient.ga_weeks = Number(session.gaWeeks);
  return patient;
}

export function splitList(s) {
  return String(s || '').split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
}

export function PatientSessionProvider({ children }) {
  const [session, setSession] = useState(empty);
  const value = useMemo(() => ({
    session,
    setSession,
    patch: (partial) => setSession((s) => ({ ...s, ...partial })),
    patchFeature: (key, val) => setSession((s) => ({
      ...s,
      features: { ...s.features, [key]: val },
    })),
    patchExam: (systemId, optionId) => setSession((s) => ({
      ...s,
      exam: { ...s.exam, [systemId]: optionId },
    })),
    patchOrders: (kind, ids) => setSession((s) => ({
      ...s,
      orders: { labs: [], imaging: [], consults: [], ...s.orders, [kind]: ids },
    })),
    reset: () => setSession(empty),
    patient: buildPatient(session),
    findings: splitList(session.findingsText),
  }), [session]);
  return (
    <PatientSessionContext.Provider value={value}>
      {children}
    </PatientSessionContext.Provider>
  );
}

export function usePatientSession() {
  const ctx = useContext(PatientSessionContext);
  if (!ctx) {
    return {
      session: empty,
      setSession: () => {},
      patch: () => {},
      patchFeature: () => {},
      patchExam: () => {},
      patchOrders: () => {},
      reset: () => {},
      patient: {},
      findings: [],
    };
  }
  return ctx;
}
