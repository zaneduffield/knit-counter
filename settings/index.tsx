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

        <Button
          label="Reset Repeat Count"
          onClick={() => {
            typedSetting
              .getToUpdate()
              .projectsByName.get("my project").needsReset = true;
            typedSetting.commit();
          }}
        />
      </Section>
      {/* <Section
        title={<Text bold align="center">Color Settings</Text>}
      >
        <Text>Text Colour</Text>
        <ColorSelect
          settingsKey="textColour"
          colors={[
            { color: 'tomato' },
            { color: 'sandybrown' },
            { color: 'gold' },
            { color: 'aquamarine' },
            { color: 'deepskyblue' },
            { color: 'plum' }
          ]}
        />
        <Text>Circle Colour</Text>
        <ColorSelect
          settingsKey="circleColour"
          colors={[
            { color: 'tomato' },
            { color: 'sandybrown' },
            { color: 'gold' },
            { color: 'aquamarine' },
            { color: 'deepskyblue' },
            { color: 'plum' }
          ]}
        />
        <Text>Button Main</Text>
        <ColorSelect
          settingsKey="buttonMainColour"
          colors={[
            { color: 'tomato' },
            { color: 'sandybrown' },
            { color: 'gold' },
            { color: 'aquamarine' },
            { color: 'deepskyblue' },
            { color: 'plum' }
          ]}
        />
        <Text>Button Secondary Colour</Text>
        <ColorSelect
          settingsKey="buttonSecondaryColour"
          colors={[
            { color: 'tomato' },
            { color: 'sandybrown' },
            { color: 'gold' },
            { color: 'aquamarine' },
            { color: 'deepskyblue' },
            { color: 'plum' }
          ]}
        />
      </Section> */}
    </Page>
  );
}

registerSettingsPage(Colors);
