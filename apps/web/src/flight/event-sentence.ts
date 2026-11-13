import type { FlightEvent } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { eventValues } from "./event-log.ts";

/** The translated sentence of a log event (Events.* messages). */
export function useEventSentence(): (event: FlightEvent) => string {
  const sentence = useTranslations("Events");
  return (event) => {
    const values = eventValues(event);
    if (event.type === "touchdown" && values["vs"] === undefined)
      return sentence("touchdownUnknown");
    return sentence(event.type, values);
  };
}
