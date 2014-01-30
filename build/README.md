# MOJ Asset Builder

This folder contains a Gruntfile which will pull together the dependencies and create a source and distribution version of the files.

It requires you to have the following folders at the same level as the main moj-assets folder:

- [govuk_template](https://github.com/alphagov/govuk_template)
- [govuk_frontend_toolkit](https://github.com/alphagov/govuk_frontend_toolkit)
- [moj_boilerplate](https://github.com/alphagov/moj_boilerplate)

To run the build, use the following command:

    grunt build

After running a new build and before pushing to the repository, update the version number in:

- `bower.json`
- `package.json`

And add a new changelog entry in:
- `changelog.md`