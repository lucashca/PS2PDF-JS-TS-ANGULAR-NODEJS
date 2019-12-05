

-- Criar database user_db 

CREATE DATABASE user_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'pt_BR.UTF-8'
    LC_CTYPE = 'pt_BR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Criar database file_db

CREATE DATABASE file_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'pt_BR.UTF-8'
    LC_CTYPE = 'pt_BR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;


-- Criar tabela file



CREATE TABLE public.file
(
    "originalName" text COLLATE pg_catalog."default",
    "mimeType" text COLLATE pg_catalog."default",
    "size" text COLLATE pg_catalog."default",
    "path" text COLLATE pg_catalog."default",
    "fileName" text COLLATE pg_catalog."default",
    "ipRequest" text COLLATE pg_catalog."default",
    "systemInfo" text COLLATE pg_catalog."default",
    "host" text COLLATE pg_catalog."default",
    "date" text COLLATE pg_catalog."default",
    "file" bytea,
    id integer NOT NULL PRIMARY KEY
)
   





-- Criar tabela user


CREATE TABLE public."user"
(
    "name" text COLLATE pg_catalog."default",
    "password" text COLLATE pg_catalog."default",
    "email" text COLLATE pg_catalog."default",
    id integer NOT NULL PRIMARY KEY
)



-- Regras para serem executadas no manager_db









--- MANAGE_DB


-- ADD dblink

CREATE EXTENSION dblink;

CREATE TABLE public."user"
(
    "name" text COLLATE pg_catalog."default",
    "password" text COLLATE pg_catalog."default",
    "email" text COLLATE pg_catalog."default",
    id integer NOT NULL PRIMARY KEY
)

CREATE TABLE public.request
(
    ip_request text COLLATE pg_catalog."default",
    date text COLLATE pg_catalog."default",
    host text COLLATE pg_catalog."default"
)

CREATE TABLE public."fileInfo"
(
    "originalName" text COLLATE pg_catalog."default",
    "fileName" text COLLATE pg_catalog."default",
    path text COLLATE pg_catalog."default"
)

CREATE TABLE public.file
(
    "originalName" text COLLATE pg_catalog."default",
    "mimeType" text COLLATE pg_catalog."default",
    "size" text COLLATE pg_catalog."default",
    "path" text COLLATE pg_catalog."default",
    "fileName" text COLLATE pg_catalog."default",
    "ipRequest" text COLLATE pg_catalog."default",
    "systemInfo" text COLLATE pg_catalog."default",
    "host" text COLLATE pg_catalog."default",
    "date" text COLLATE pg_catalog."default",
    "file" bytea,
    id integer NOT NULL PRIMARY KEY
)




-- Views 

CREATE VIEW selectFile AS SELECT * FROM 
dblink('host=127.0.0.1 user=postgres password=postgres dbname=file_db','SELECT "originalName", "mimeType", "size", "path", "fileName", "ipRequest", "systemInfo", "host", "date", "file", "id" FROM file;') 
as t(originalName text,mimeType text,size text,path text,fileName text,ipRequest text,systemInfo text,host text,date text,file bytea,id int);

CREATE VIEW selectUser AS SELECT * FROM 
dblink('host=127.0.0.1 user=postgres password=postgres dbname=user_db','SELECT "name", "email", "password" , "id" FROM "user";') 
as t(name text, email text, password text,id int);

CREATE VIEW selectFileInfo AS SELECT * FROM 
dblink('host=127.0.0.1 user=postgres password=postgres dbname=fileinfo_db','SELECT "originalName", "fileName", path FROM public."fileInfo";') 
as t("originalName" text,"fileName" text, path text);

CREATE VIEW selectRequest AS SELECT * FROM 
dblink('host=127.0.0.1 user=postgres password=postgres dbname=request_db','SELECT ip_request, date, host FROM public.request;') 
as t(ip_request text,date text, host text);


-- Rules
create rule insertFile as on insert to "file"
do instead select dblink_exec('dbname=file_db hostaddr=127.0.0.1 user=postgres password=postgres',
concat('INSERT INTO public.file(
	"originalName", "mimeType", size, path, "fileName", "ipRequest", "systemInfo", host, date, file) VALUES('
	   ,quote_nullable(NEW."originalName"),',',quote_nullable(NEW."mimeType"),','
	   ,quote_nullable(NEW.size),',',quote_nullable(NEW.path),',',quote_nullable(NEW."fileName"),','
	   ,quote_nullable(NEW."ipRequest"),',',quote_nullable(NEW."systemInfo"),',',quote_nullable(NEW.host),','
	   ,quote_nullable(NEW.date),',',quote_nullable(NEW.file),');'));


create rule insertUser as on insert to "user"
do instead select dblink_exec('dbname=user_db hostaddr=127.0.0.1 user=postgres password=postgres',
concat('INSERT INTO "user"(name, password, email) VALUES('
	   ,quote_nullable(NEW.name),',',quote_nullable(NEW.password),',',quote_nullable(NEW.email),');'),true);

create rule insertFileInfo as on insert to public."fileInfo"
do instead select dblink_exec('dbname=fileinfo_db hostaddr=127.0.0.1 user=postgres password=postgres',
concat('INSERT INTO public."fileInfo"("originalName", "fileName", path) VALUES('
	   ,quote_nullable(NEW."originalName"),',',quote_nullable(NEW."fileName"),',',quote_nullable(NEW.path),');'),true);

create rule insertRequest as on insert to public.request
do instead select dblink_exec('dbname=request_db hostaddr=127.0.0.1 user=postgres password=postgres',
concat('INSERT INTO "request"(
	ip_request, date, host) VALUES('
	   ,quote_nullable(NEW.ip_request),',',quote_nullable(NEW.date),',',quote_nullable(NEW.host),');'),true);

