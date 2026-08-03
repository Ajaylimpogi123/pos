import { useState } from "react";

const TABS = ["requests", "orders", "receiving", "logs"];
const STORAGE_KEY = "purchasingActiveTab";

export default function usePurchasingTabs() {
    const [activeTab, setActiveTabState] = useState(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return TABS.includes(stored) ? stored : "requests";
    });

    const setActiveTab = (tab) => {
        setActiveTabState(tab);
        window.localStorage.setItem(STORAGE_KEY, tab);
    };

    return { activeTab, setActiveTab, TABS };
}
