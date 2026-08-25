import React from "react";
import * as Chem from "./ChemistryExperiments.jsx";
import * as Phys from "./PhysicsExperiments.jsx";
import * as Kitchen from "./KitchenExperiments.jsx";
import * as Design from "./DesignExperiments.jsx";
import * as Bonus from "./BonusExperiments.jsx";

const EXP_MAP = {
  color_mix: Chem.ColorMixExp,
  volcano: Chem.VolcanoExp,
  ph_scale: Chem.PhScaleExp,
  states: Chem.StatesExp,
  elements: Chem.ElementsExp,
  pendulum: Phys.PendulumExp,
  magnets: Phys.MagnetsExp,
  prism: Phys.PrismExp,
  circuit: Phys.CircuitExp,
  roller: Phys.RollerExp,
  smoothie: Kitchen.SmoothieExp,
  measure: Kitchen.MeasureExp,
  food_groups: Kitchen.FoodGroupsExp,
  bread_rise: Kitchen.BreadRiseExp,
  recipe_builder: Kitchen.RecipeBuilderExp,
  greeting_card: Design.GreetingCardExp,
  typography: Design.TypographyExp,
  sticker_scene: Design.StickerSceneExp,
  mad_libs: Design.MadLibsExp,
  banner: Design.BannerExp,
  rhythm: Bonus.RhythmExp,
  sound_wave: Bonus.SoundWaveExp,
  weather: Bonus.WeatherExp,
  ecosystem: Bonus.EcosystemExp,
};

export default function LabExperimentPanel({ experimentId, lang, onComplete, onSave }) {
  const Comp = EXP_MAP[experimentId];
  if (!Comp) return null;
  return (
    <div className="kids-glass-card p-4 sm:p-5 kids-fade-in">
      <Comp lang={lang} onComplete={onComplete} onSave={onSave} />
    </div>
  );
}

export { EXP_MAP };
