PS2PDF

A system that convert a file ps to pdf done in a distributed was published in Google Cloud platform.

This was work done for the distributed systems discipline. In this work we propose a leaderless-based system.Thus, there is a pool of workers that communicate to collectively decide when to process a job.

This system save a file in a MySQL data base and then create a register in a Redis server for a work. 

For the development of the web page was used the Angular framework in
its version 7, with this it is possible to implement a SPA front-end (Single
Page Applications) using several existing libraries with various components
that facilitate its development

For the development of the back end system Node.js technology was used,
it has an architecture that can be named with single thread with non-blocking
IO, so it is possible to perform simultaneous requests so that the disk access
for each request will occur in parallel. Each data persistence will occur
asynchronously on the server, and when the process is completed a call will
be made informing the process completion. Figure 1 shows the architecture
present in Node.js.

The express framework was also used in the back-end, with it is possible
to model an api in a simple and agile way, using middle ware for configurations and its existing methods for creating endpoints to be consumed by its customers.

For the database was used MySQL technology, with this it is possible to
model a robust database that can hold data in BLOB (Binary Large Object)
format, for the storage of binary files in the database.

For the cache server the Redis technology was used, with this it is possible
to store records composed by key and value of agile and simple form.

For publishing the server and database, we used the Google Cloud platform, with which it is possible to create instances of virtual servers to run applications on the network.

For publishing the web page, the free web host 000Webhost was used, with
which it is possible to publish pages and obtain a web address for access.

Several features are necessary to ensure the correct execution of distributed systems, to ensure mutually exclusion from a database we must solve a consensus problem between the nodes of the network. The proposed system was able to solve this problem using asynchronous programming techniques.

The system was tested by sending several simultaneous requests with different file numbers and it was able to behave properly, answering all requests
correctly.
