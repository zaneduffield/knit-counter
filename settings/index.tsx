import { ProjectSettings } from "../common/settingsTypes"
import { TypedSettingProps, ASIS, SettingsComponentProps } from "fitbit-settings-commons"

function Colors(props: SettingsComponentProps) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Repeat Settings</Text>}
      >
        <TextInput
          label="repeat length"
          settingsKey="repeatLength"
          type="number"
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(Colors);
