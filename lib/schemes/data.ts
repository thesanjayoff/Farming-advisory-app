import type { SchemeInfo } from "@/lib/schemes/types";

import pmKisan from "@/data/schemes/pm_kisan.json";
import pmfby from "@/data/schemes/pmfby.json";
import soilHealthCard from "@/data/schemes/soil_health_card.json";
import pmKusum from "@/data/schemes/pm_kusum.json";
import kisanCreditCard from "@/data/schemes/kisan_credit_card.json";
import enam from "@/data/schemes/enam.json";

export const schemes: SchemeInfo[] = [pmKisan, pmfby, soilHealthCard, pmKusum, kisanCreditCard, enam];
