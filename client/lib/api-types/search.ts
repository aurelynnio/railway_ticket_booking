export interface SearchTripResponse {
  ticketId: string;
  title: string | null;
  trainNumber: string | null;
  from: {
    code: string | null;
    name: string | null;
  };
  to: {
    code: string | null;
    name: string | null;
  };
  dateStart: string | null;
  dateEnd: string | null;
  minPrice: number | null;
  availableSeats: number;
  seatClasses: string[];
  seatTypes: string[];
}

export interface StationSuggestionResponse {
  code: string | null;
  name: string | null;
}
