package com.paltform.VoicesOfSyria.Enum;

public enum Province {
    DAMASCUS("دمشق"),
    RIFDIMASHQ("ريف دمشق"),
    ALEPPO("حلب"),
    HOMS("حمص"),
    HAMA("حماة"),
    LATTAKIA("اللاذقية"),
    TARTOUS("طرطوس"),
    IDLIB("إدلب"),
    DERAA("درعا"),
    SUWAYDA("السويداء"),
    DEIR_EZZOR("دير الزور"),
    RAQQA("الرقة"),
    QUNEITRA("القنيطرة"),
    HASAKAH("الحسكة");

    private final String arabicName;

    Province(String arabicName) {
        this.arabicName = arabicName;
    }

    public String getArabicName() {
        return arabicName;
    }
}
