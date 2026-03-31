# employee_webapp
For creating the webAPI using .NET

```bash
$ dotnet new webapi -o api
```

For running the .NET web application.

```bash
$ dotnet watch run
```

Model Creation for Stock and Comment. And one to many relationship between these models.
In .NET ORM (object relational mapper) in **entity framework**. It converts the database tables into objects.

Creation of Data =====>  db context for accessing the database ======> chose sql server and provide connection string.
Manusal creation of database table in sql server studio.
Add connection string in AppSettings.json .
Run migration to create the models as databse in SQL studio.

```bash
$ dotnet ef migrations add init
```

```bash
$ dotnet ef database update
```
in case of change in db and for updating, 
```bash
$ dotnet ef migrations add InitialCreate
$ dotnet ef database update
```
