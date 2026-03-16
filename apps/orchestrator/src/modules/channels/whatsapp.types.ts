export interface WhatsAppContact {
  profile?: {
    name?: string;
  };
  wa_id?: string;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  text?: {
    body?: string;
  };
}

export interface WhatsAppValue {
  metadata?: {
    phone_number_id?: string;
    display_phone_number?: string;
  };
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
}

export interface WhatsAppChange {
  value?: WhatsAppValue;
}

export interface WhatsAppEntry {
  changes?: WhatsAppChange[];
}

export interface WhatsAppInboundPayload {
  entry?: WhatsAppEntry[];
}
