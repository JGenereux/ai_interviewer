import type { Message } from "@/types/message";
import type { TransportEvent } from "@openai/agents/realtime";

const minEvents = new Set(['conversation.item.input_audio_transcription.completed',
    'response.output_audio_transcript.done'])

type TranscriptEvent = TransportEvent & {
        transcript: string;
        item_id: string;
        event_id: string;
};

export function eventToMessage(e: TransportEvent): Message | null {
    const ev = e as TranscriptEvent
    if (!minEvents.has(ev.type)) return null;
    const role =
      e.type.startsWith("conversation") ? "user" : "agent";
  
    return {
      role,
      content: ev.transcript,
      id: ev.item_id,
      event_id: ev.event_id,
      created: Date.now(),
    };
  }