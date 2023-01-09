import { ProjectSettings, defaultProject } from "../common/settingsTypes";
import {
  TypedSettingProps,
  ASIS,
  SettingsComponentProps,
} from "fitbit-settings-commons";

function Colors(props: SettingsComponentProps) {
  const typedSetting: TypedSettingProps<ProjectSettings> =
    new TypedSettingProps(props, {
      projects: {
        unpackInitiator: (v) =>
          v === undefined
            ? [...Array(10)].map(() => defaultProject())
            : JSON.parse(v),
      },
      numProjects: {
        unpackInitiator: (v) => (v === undefined ? 10 : JSON.parse(v)),
      },
    });

  while (typedSetting.get().numProjects >= typedSetting.get().projects.length) {
    typedSetting.get().projects.push(defaultProject());
  }

  return (
    <Page>
      <Section
        title={
          <Text bold align="center">
            Global Settings
          </Text>
        }
      >
        <TextInput
          label="Number of Projects"
          // settingsKey="numProjects"
          value={`${typedSetting.get().numProjects}`}
          onChange={(v) => {
            // @ts-ignore; I don't know why the value passed here is actually an Object and not a string.
            typedSetting.update({ numProjects: parseInt(v.name) });
          }}
          type="number"
        />
      </Section>

      {[...Array(typedSetting.get().numProjects)].map((_, i) => {
        console.log(
          `repeatLength: ${typedSetting.get().projects[i].repeatLength}`
        );

        return (
          <Section
            title={
              <Text bold align="center">
                Project {i}
              </Text>
            }
          >
            <TextInput
              label="Repeat Length"
              value={`${typedSetting.get().projects[i].repeatLength}`}
              onChange={(v) => {
                typedSetting.getToUpdate().projects[i].repeatLength = parseInt(
                  // @ts-ignore; I don't know why the value passed here is actually an Object and not a string.
                  v.name
                );
                typedSetting.commit();
              }}
              type="number"
            />
          </Section>
        );
      })}
    </Page>
  );
}

registerSettingsPage(Colors);
