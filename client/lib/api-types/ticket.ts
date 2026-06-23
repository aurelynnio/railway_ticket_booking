export interface TicketItemResponse {
  id: string;
  ticketId: string | null;
  name: string | null;
  description: string | null;
  coachCode: string | null;
  seatClass: string | null;
  seatType: string | null;
  seatLabels: string[];
  availableSeatLabels: string[];
  occupiedSeatLabels: string[];
  stockInitial: number | null;
  stockAvailable: number | null;
  stockPrepared: boolean;
  priceOriginal: number | null;
  priceFlash: number | null;
  saleStartTime: string | null;
  saleEndTime: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  saleOpen: boolean;
}

export interface TicketResponse {
  id: string;
  title: string | null;
  trainNumber: string | null;
  departureStationCode: string | null;
  departureStationName: string | null;
  arrivalStationCode: string | null;
  arrivalStationName: string | null;
  journeyNote: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  status: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  ticketItems: TicketItemResponse[];
}

export interface TicketAvailabilityResponse {
  ticketId: string;
  status: number;
  saleOpen: boolean;
  items: TicketItemResponse[];
}

export interface SeatMapResponse {
  ticketId: string;
  items: Array<{
    ticketItemId: string;
    coachCode: string | null;
    seatClass: string | null;
    seatType: string | null;
    seatLabels: string[];
    availableSeatLabels: string[];
    occupiedSeatLabels: string[];
  }>;
}

export interface UpdateTicketRequest {
  title?: string;
  trainNumber?: string;
  departureStationCode?: string;
  departureStationName?: string;
  arrivalStationCode?: string;
  arrivalStationName?: string;
  journeyNote?: string;
  dateStart?: string;
  dateEnd?: string;
  status?: number;
}

export interface UpdateTicketItemRequest {
  name?: string;
  description?: string;
  coachCode?: string;
  seatClass?: string;
  seatType?: string;
  seatLabels?: string[];
  availableSeatLabels?: string[];
  stockInitial?: number;
  stockAvailable?: number;
  stockPrepared?: boolean;
  priceOriginal?: number | string;
  priceFlash?: number | string;
  saleStartTime?: string;
  saleEndTime?: string;
}

export interface PrepareStockRequest {
  ticketItemId?: string;
  stockInitial?: number;
  availableSeatLabels?: string[];
}

export interface OpenSaleRequest {
  ticketItemId?: string;
  saleStartTime?: string;
  saleEndTime?: string;
}

export interface ChangePriceRequest {
  priceOriginal?: number | string;
  priceFlash?: number | string;
}

export interface ChangeSaleWindowRequest {
  saleStartTime?: string;
  saleEndTime?: string;
}
