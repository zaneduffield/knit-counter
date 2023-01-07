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
