import { ProjectSettings } from "../common/settingsTypes";
import {
  TypedSettingProps,
  ASIS,
  SettingsComponentProps,
} from "fitbit-settings-commons";

function Colors(props: SettingsComponentProps) {
  const typedSetting: TypedSettingProps<ProjectSettings> =
    new TypedSettingProps(props, {
      projectsByName: {
        unpackInitiator: (v) =>
          v === undefined
            ? new Map([["my project", { needsReset: false, repeatLength: 0 }]])
            : JSON.parse(v),
      },
    });

  return (
    <Page>
      <Section
        title={
          <Text bold align="center">
            Repeat Settings
          </Text>
        }
      >
        <TextInput
          label="Repeat Length"
          settingsKey="repeatLength"
          type="number"
        />

      </Section>
    </Page>
  );
}

registerSettingsPage(Colors);
