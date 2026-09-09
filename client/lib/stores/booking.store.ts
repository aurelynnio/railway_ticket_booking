"use client";

import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

export type PassengerType = "ADULT" | "CHILD" | "STUDENT" | "SENIOR";

export interface PassengerInfo {
  seatId: string;
  seatLabel: string;
  coachCode: string;
  unitPrice: number;
  fullName: string;
  idCard: string; // CCCD / Hộ chiếu / Ngày sinh
  passengerType: PassengerType;
}

export interface SelectedTripInfo {
  ticketId: string;
  trainNumber: string | null;
  title: string | null;
  departureStationCode: string | null;
  departureStationName: string | null;
  arrivalStationCode: string | null;
  arrivalStationName: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
}

export interface ContactInfo {
  email: string;
  phone: string;
  fullName: string;
}

export const PASSENGER_DISCOUNTS: Record<PassengerType, { label: string; rate: number; discountPercent: number }> = {
  ADULT: { label: "Người lớn", rate: 1.0, discountPercent: 0 },
  CHILD: { label: "Trẻ em (6-10 tuổi)", rate: 0.75, discountPercent: 25 },
  STUDENT: { label: "Học sinh / Sinh viên", rate: 0.9, discountPercent: 10 },
  SENIOR: { label: "Người cao tuổi (≥60 tuổi)", rate: 0.85, discountPercent: 15 },
};

export function calculatePassengerPrice(unitPrice: number, type: PassengerType): number {
  const discount = PASSENGER_DISCOUNTS[type] ?? PASSENGER_DISCOUNTS.ADULT;
  return Math.round((unitPrice * discount.rate) / 1000) * 1000;
}

interface BookingState {
  // State
  currentStep: number;
  trip: SelectedTripInfo | null;
  selectedItemId: string | null;
  passengers: PassengerInfo[];
  contactInfo: ContactInfo;
  holdExpiresAt: number | null; // Timestamp ms
  idempotencyKey: string;

  // Actions
  setTrip: (trip: SelectedTripInfo) => void;
  setSelectedItemId: (itemId: string | null) => void;
  setStep: (step: number) => void;
  toggleSeat: (seat: { seatId: string; seatLabel: string; coachCode: string; unitPrice: number }) => void;
  selectSeats: (seats: Array<{ seatId: string; seatLabel: string; coachCode: string; unitPrice: number }>) => void;
  removeSeat: (seatId: string) => void;
  updatePassenger: (seatId: string, data: Partial<Omit<PassengerInfo, "seatId">>) => void;
  setContactInfo: (contact: Partial<ContactInfo>) => void;
  startHoldTimer: (durationSeconds?: number) => void;
  clearHoldTimer: () => void;
  renewIdempotencyKey: () => void;
  resetBooking: () => void;

  // Computed getters
  getTotalPrice: () => number;
  getRawTotal: () => number;
  getTotalDiscount: () => number;
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const initialState = {
  currentStep: 1,
  trip: null,
  selectedItemId: null,
  passengers: [],
  contactInfo: {
    email: "",
    phone: "",
    fullName: "",
  },
  holdExpiresAt: null,
  idempotencyKey: generateIdempotencyKey(),
};

export const useBookingStore = create<BookingState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setTrip: (trip) =>
          set((state) => ({
            trip,
            // If selecting a different trip, clear old selected seats
            passengers: state.trip?.ticketId === trip.ticketId ? state.passengers : [],
          })),

        setSelectedItemId: (selectedItemId) => set({ selectedItemId }),

        setStep: (currentStep) => set({ currentStep }),

        toggleSeat: (seat) => {
          const { passengers } = get();
          const exists = passengers.some((p) => p.seatId === seat.seatId);

          if (exists) {
            set({
              passengers: passengers.filter((p) => p.seatId !== seat.seatId),
            });
          } else {
            set({
              passengers: [
                ...passengers,
                {
                  seatId: seat.seatId,
                  seatLabel: seat.seatLabel,
                  coachCode: seat.coachCode,
                  unitPrice: seat.unitPrice,
                  fullName: "",
                  idCard: "",
                  passengerType: "ADULT",
                },
              ],
            });
          }
        },

        selectSeats: (seats) => {
          const currentPassengers = get().passengers;
          const currentMap = new Map(currentPassengers.map((p) => [p.seatId, p]));

          const nextPassengers: PassengerInfo[] = seats.map((s) => {
            const existing = currentMap.get(s.seatId);
            if (existing) {
              return { ...existing, unitPrice: s.unitPrice, coachCode: s.coachCode, seatLabel: s.seatLabel };
            }
            return {
              seatId: s.seatId,
              seatLabel: s.seatLabel,
              coachCode: s.coachCode,
              unitPrice: s.unitPrice,
              fullName: "",
              idCard: "",
              passengerType: "ADULT",
            };
          });

          set({ passengers: nextPassengers });
        },

        removeSeat: (seatId) => {
          set((state) => ({
            passengers: state.passengers.filter((p) => p.seatId !== seatId),
          }));
        },

        updatePassenger: (seatId, data) => {
          set((state) => ({
            passengers: state.passengers.map((p) =>
              p.seatId === seatId ? { ...p, ...data } : p
            ),
          }));
        },

        setContactInfo: (contact) => {
          set((state) => ({
            contactInfo: { ...state.contactInfo, ...contact },
          }));
        },

        startHoldTimer: (durationSeconds = 600) => {
          set({ holdExpiresAt: Date.now() + durationSeconds * 1000 });
        },

        clearHoldTimer: () => {
          set({ holdExpiresAt: null });
        },

        renewIdempotencyKey: () => {
          set({ idempotencyKey: generateIdempotencyKey() });
        },

        resetBooking: () => {
          set({
            ...initialState,
            idempotencyKey: generateIdempotencyKey(),
          });
        },

        getTotalPrice: () => {
          const { passengers } = get();
          return passengers.reduce((sum, p) => sum + calculatePassengerPrice(p.unitPrice, p.passengerType), 0);
        },

        getRawTotal: () => {
          const { passengers } = get();
          return passengers.reduce((sum, p) => sum + p.unitPrice, 0);
        },

        getTotalDiscount: () => {
          const raw = get().getRawTotal();
          const discounted = get().getTotalPrice();
          return Math.max(0, raw - discounted);
        },
      }),
      {
        name: "vietrail-booking-session",
        storage: createJSONStorage(() => {
          if (typeof window !== "undefined") {
            return window.sessionStorage;
          }
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }),
      }
    ),
    { name: "VietrailBookingStore" }
  )
);
