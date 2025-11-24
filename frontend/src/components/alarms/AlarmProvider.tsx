import React, {
  createContext,
  useContext,
} from "react";

import type { Alarm } from "../../services/alarmService";

type AlarmContextType = {
  triggerAlarmPopup: (alarm: Alarm) => void;
  closeAlarmPopup: () => void;
  enqueueAlarmTrigger: (alarm: Alarm) => void;
};

const AlarmContext = createContext<AlarmContextType | null>(null);

export const useAlarmPopup = () => {
  const ctx = useContext(AlarmContext);
  if (!ctx) {
    // Return dummy functions if context is missing or disabled
    return {
      triggerAlarmPopup: () => { },
      closeAlarmPopup: () => { },
      enqueueAlarmTrigger: () => { },
    }
  }
  return ctx;
};

function AlarmProvider({ children }: { children: React.ReactNode }) {
  // Dummy implementation that does nothing
  const triggerAlarmPopup = () => { };
  const closeAlarmPopup = () => { };
  const enqueueAlarmTrigger = () => { };

  return (
    <AlarmContext.Provider
      value={{
        triggerAlarmPopup,
        closeAlarmPopup,
        enqueueAlarmTrigger,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
}

export default AlarmProvider;
