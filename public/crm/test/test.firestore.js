describe("firestore", () => {
  var db;
  before(() => {
    var config = {
      apiKey: "AIzaSyAIqw87uhiX-YlQPJSOXLJlRtzF9gSo6KU",
      authDomain: "sensory-interface-prod.firebaseapp.com",
      projectId: "sensory-interface-prod",
    };
    var app = firebase.initializeApp(config);
    db = firebase.firestore(app);
    //firebase.firestore.setLogLevel("debug");
  });

  describe("collection('users')", () => {
    it("should add data to a collection", () => {
      return output =
        // [START add_ada_lovelace]
        db.collection("users").add({
          first: "Ada",
          last: "Lovelace",
          born: 1815
        })
          .then(function (docRef) {
            console.log("Document written with ID: ", docRef.id);
          })
          .catch(function (error) {
            console.error("Error adding document: ", error);
          });
      // [END add_ada_lovelace]
    });

    it("should get all users", () => {
      return output =
        // [START get_all_users]
        db.collection("users").get().then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            console.log(`${doc.id} => ${doc.data()}`);
          });
        });
      // [END get_all_users]
    });

    it("should add data to a collection with new fields", () => {
      return output =
        // [START add_alan_turing]
        // Add a second document with a generated ID.
        db.collection("users").add({
          first: "Alan",
          middle: "Mathison",
          last: "Turing",
          born: 1912
        })
          .then(function (docRef) {
            console.log("Document written with ID: ", docRef.id);
          })
          .catch(function (error) {
            console.error("Error adding document: ", error);
          });
      // [END add_alan_turing]
    });

    it("should loop through a watched collection", (done) => {
      // This is not a typo.
      var unsubscribe =

        // [START listen_for_users]
        db.collection("users")
          .where("born", "<", 1900)
          .onSnapshot(function (snapshot) {
            console.log("Current users born before 1900:");
            snapshot.forEach(function (userSnapshot) {
              console.log(userSnapshot.data())
            });
          });
      // [END listen_for_users]

      setTimeout(() => {
        unsubscribe();
        done();
      }, 1500);
    });

    it("should reference a specific document", () => {
      // [START doc_reference]
      var alovelaceDocumentRef = db.collection('users').doc('alovelace');
      // [END doc_reference]
    });

    it("should reference a specific collection", () => {
      // [START collection_reference]
      var usersCollectionRef = db.collection('users');
      // [END collection_reference]
    });

    it("should reference a specific document (alternative)", () => {
      // [START doc_reference_alternative]
      var alovelaceDocumentRef = db.doc('users/alovelace');
      // [END doc_reference_alternative]
    })

    it("should reference a document in a subcollection", () => {
      // [START subcollection_reference]
      var messageRef = db.collection('rooms').doc('roomA')
        .collection('messages').doc('message1');
      // [END subcollection_reference]
    });

    it("should set a document", () => {
      return output =
        // [START set_document]
        // Add a new document in collection "cities"
        db.collection("cities").doc("LA").set({
          name: "Los Angeles",
          state: "CA",
          country: "USA"
        })
          .then(function () {
            console.log("Document successfully written!");
          })
          .catch(function (error) {
            console.error("Error writing document: ", error);
          });
      // [END set_document]
    });

    it("should support batch writes", (done) => {
      // [START write_batch]
      // Get a new write batch
      var batch = db.batch();

      // Set the value of 'NYC'
      var nycRef = db.collection("cities").doc("NYC");
      batch.set(nycRef, { name: "New York City" });

      // Update the population of 'SF'
      var sfRef = db.collection("cities").doc("SF");
      batch.update(sfRef, { "population": 1000000 });

      // Delete the city 'LA'
      var laRef = db.collection("cities").doc("LA");
      batch.delete(laRef);

      // Commit the batch
      batch.commit().then(function () {
        // [START_EXCLUDE]
        done();
        // [END_EXCLUDE]
      });
      // [END write_batch]
    });

    it("should set a document with every datatype #UNVERIFIED", () => {
      // [START data_types]
      var docData = {
        stringExample: "Hello world!",
        booleanExample: true,
        numberExample: 3.14159265,
        dateExample: firebase.firestore.Timestamp.fromDate(new Date("December 10, 1815")),
        arrayExample: [5, true, "hello"],
        nullExample: null,
        objectExample: {
          a: 5,
          b: {
            nested: "foo"
          }
        }
      };
      db.collection("data").doc("one").set(docData).then(function () {
        console.log("Document successfully written!");
      });
      // [END data_types]
    });

    it("should allow set with merge", () => {
      // [START set_with_merge]
      var cityRef = db.collection('cities').doc('BJ');

      var setWithMerge = cityRef.set({
        capital: true
      }, { merge: true });
      // [END set_with_merge]
      return setWithMerge;
    });

    it("should update a document's nested fields #UNVERIFIED", () => {
      // [START update_document_nested]
      // Create an initial document to update.
      var frankDocRef = db.collection("users").doc("frank");
      frankDocRef.set({
        name: "Frank",
        favorites: { food: "Pizza", color: "Blue", subject: "recess" },
        age: 12
      });

      // To update age and favorite color:
      db.collection("users").doc("frank").update({
        "age": 13,
        "favorites.color": "Red"
      })
        .then(function () {
          console.log("Document successfully updated!");
        });
      // [END update_document_nested]
    });

    it("should delete a collection", () => {
      // [START delete_collection]
      /**
       * Delete a collection, in batches of batchSize. Note that this does
       * not recursively delete subcollections of documents in the collection
       */
      function deleteCollection(db, collectionRef, batchSize) {
        var query = collectionRef.orderBy('__name__').limit(batchSize);

        return new Promise(function (resolve, reject) {
          deleteQueryBatch(db, query, batchSize, resolve, reject);
        });
      }

      function deleteQueryBatch(db, query, batchSize, resolve, reject) {
        query.get()
          .then((snapshot) => {
            // When there are no documents left, we are done
            if (snapshot.size == 0) {
              return 0;
            }

            // Delete documents in a batch
            var batch = db.batch();
            snapshot.docs.forEach(function (doc) {
              batch.delete(doc.ref);
            });

            return batch.commit().then(function () {
              return snapshot.size;
            });
          }).then(function (numDeleted) {
            if (numDeleted < batchSize) {
              resolve();
              return;
            }

            // Recurse on the next process tick, to avoid
            // exploding the stack.
            setTimeout(function () {
              deleteQueryBatch(db, query, batchSize, resolve, reject);
            }, 0);
          })
          .catch(reject);
      }
      // [END delete_collection]

      return deleteCollection(db, db.collection("users"), 2);
    }).timeout(2000);
  });

  describe("collection('cities')", () => {
    it("should set documents #UNVERIFIED", () => {
      // [START example_data]
      var citiesRef = db.collection("cities");

      citiesRef.doc("SF").set({
        name: "San Francisco", state: "CA", country: "USA",
        capital: false, population: 860000,
        regions: ["west_coast", "norcal"]
      });
      citiesRef.doc("LA").set({
        name: "Los Angeles", state: "CA", country: "USA",
        capital: false, population: 3900000,
        regions: ["west_coast", "socal"]
      });
      citiesRef.doc("DC").set({
        name: "Washington, D.C.", state: null, country: "USA",
        capital: true, population: 680000,
        regions: ["east_coast"]
      });
      citiesRef.doc("TOK").set({
        name: "Tokyo", state: null, country: "Japan",
        capital: true, population: 9000000,
        regions: ["kanto", "honshu"]
      });
      citiesRef.doc("BJ").set({
        name: "Beijing", state: null, country: "China",
        capital: true, population: 21500000,
        regions: ["jingjinji", "hebei"]
      });
      // [END example_data]
    });
    it("should set a document", () => {
      var data = {};

      return output =
        // [START cities_document_set]
        db.collection("cities").doc("new-city-id").set(data);
      // [END cities_document_set]
    });

    it("should add a document", () => {
      return output =
        // [START add_document]
        // Add a new document with a generated id.
        db.collection("cities").add({
          name: "Tokyo",
          country: "Japan"
        })
          .then(function (docRef) {
            console.log("Document written with ID: ", docRef.id);
          })
          .catch(function (error) {
            console.error("Error adding document: ", error);
          });
      // [END add_document]
    });

    it("should add an empty a document #UNVERIFIED", () => {
      var data = {};
      // [START new_document]
      // Add a new document with a generated id.
      var newCityRef = db.collection("cities").doc();

      // later...
      newCityRef.set(data);
      // [END new_document]
    });

    it("should update a document", () => {
      var data = {};
      // [START update_document]
      var washingtonRef = db.collection("cities").doc("DC");

      // Set the "capital" field of the city 'DC'
      return washingtonRef.update({
        capital: true
      })
        .then(function () {
          console.log("Document successfully updated!");
        })
        .catch(function (error) {
          // The document probably doesn't exist.
          console.error("Error updating document: ", error);
        });
      // [END update_document]
    });

    it("should update an array field in a document", () => {
      // [START update_document_array]
      var washingtonRef = db.collection("cities").doc("DC");

      // Atomically add a new region to the "regions" array field.
      washingtonRef.update({
        regions: firebase.firestore.FieldValue.arrayUnion("greater_virginia")
      });

      // Atomically remove a region from the "regions" array field.
      washingtonRef.update({
        regions: firebase.firestore.FieldValue.arrayRemove("east_coast")
      });
      // [END update_document_array]
    });

    it("should update a document using numeric transforms", () => {
      // [START update_document_increment]
      var washingtonRef = db.collection('cities').doc('DC');

      // Atomically increment the population of the city by 50.
      washingtonRef.update({
        population: firebase.firestore.FieldValue.increment(50)
      });
      // [END update_document_increment]
    })

    it("should delete a document", () => {
      return output =
        // [START delete_document]
        db.collection("cities").doc("DC").delete().then(function () {
          console.log("Document successfully deleted!");
        }).catch(function (error) {
          console.error("Error removing document: ", error);
        });
      // [END delete_document]
    });

    it("should handle transactions #FIXME #UNVERIFIED", () => {
      return db.collection("cities").doc("SF").set({ population: 0 }).then(() => {
        // [START transaction]
        // Create a reference to the SF doc.
        var sfDocRef = db.collection("cities").doc("SF");

        // Uncomment to initialize the doc.
        // sfDocRef.set({ population: 0 });

        return db.runTransaction(function (transaction) {
          // This code may get re-run multiple times if there are conflicts.
          return transaction.get(sfDocRef).then(function (sfDoc) {
            if (!sfDoc.exists) {
              throw "Document does not exist!";
            }

            // Add one person to the city population.
            // Note: this could be done without a transaction
            //       by updating the population using FieldValue.increment()
            var newPopulation = sfDoc.data().population + 1;
            transaction.update(sfDocRef, { population: newPopulation });
          });
        }).then(function () {
          console.log("Transaction successfully committed!");
        }).catch(function (error) {
          console.log("Transaction failed: ", error);
        });
        // [END transaction]
      });
    });

    it("should handle transaction which bubble out data #UNVERIFIED", () => {
      // [START transaction_promise]
      // Create a reference to the SF doc.
      var sfDocRef = db.collection("cities").doc("SF");

      db.runTransaction(function (transaction) {
        return transaction.get(sfDocRef).then(function (sfDoc) {
          if (!sfDoc.exists) {
            throw "Document does not exist!";
          }

          var newPopulation = sfDoc.data().population + 1;
          if (newPopulation <= 1000000) {
            transaction.update(sfDocRef, { population: newPopulation });
            return newPopulation;
          } else {
            return Promise.reject("Sorry! Population is too big.");
          }
        });
      }).then(function (newPopulation) {
        console.log("Population increased to ", newPopulation);
      }).catch(function (err) {
        // This will be an "population is too big" error.
        console.error(err);
      });
      // [END transaction_promise]
    });

    it("should get a single document #UNVERIFIED", () => {
      // [START get_document]
      var docRef = db.collection("cities").doc("SF");

      docRef.get().then(function (doc) {
        if (doc.exists) {
          console.log("Document data:", doc.data());
        } else {
          // doc.data() will be undefined in this case
          console.log("No such document!");
        }
      }).catch(function (error) {
        console.log("Error getting document:", error);
      });
      // [END get_document]
    });

    it("should get a document with options #UNVERIFIED", () => {
      // [START get_document_options]
      var docRef = db.collection("cities").doc("SF");

      // Valid options for source are 'server', 'cache', or
      // 'default'. See https://firebase.google.com/docs/reference/js/firebase.firestore.GetOptions
      // for more information.
      var getOptions = {
        source: 'cache'
      };

      // Get a document, forcing the SDK to fetch from the offline cache.
      docRef.get(getOptions).then(function (doc) {
        // Document was found in the cache. If no cached document exists,
        // an error will be returned to the 'catch' block below.
        console.log("Cached document data:", doc.data());
      }).catch(function (error) {
        console.log("Error getting cached document:", error);
      });
      // [END get_document_options]
    });

    it("should listen on a single document", (done) => {
      var unsub =
        // [START listen_document]
        db.collection("cities").doc("SF")
          .onSnapshot(function (doc) {
            console.log("Current data: ", doc.data());
          });
      // [END listen_document]

      setTimeout(function () {
        unsub();
        done();
      }, 3000);
    }).timeout(5000);

    it("should listen on a single document with metadata #UNVERIFIED", (done) => {
      var unsub =
        // [START listen_document_local]
        db.collection("cities").doc("SF")
          .onSnapshot(function (doc) {
            var source = doc.metadata.hasPendingWrites ? "Local" : "Server";
            console.log(source, " data: ", doc.data());
          });
      // [END listen_document_local]

      setTimeout(function () {
        unsub();
        done();
      }, 3000);
    }).timeout(5000);

    it("should listen on a single document with options #UNVERIFIED", (done) => {
      var unsub =
        // [START listen_with_metadata]
        db.collection("cities").doc("SF")
          .onSnapshot({
            // Listen for document metadata changes
            includeMetadataChanges: true
          }, function (doc) {
            // ...
          });
      // [END listen_with_metadata]

      setTimeout(function () {
        unsub();
        done();
      }, 3000);
    }).timeout(5000);

    it("should get multiple documents from a collection", () => {
      return output =
        // [START get_multiple]
        db.collection("cities").where("capital", "==", true)
          .get()
          .then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
              // doc.data() is never undefined for query doc snapshots
              console.log(doc.id, " => ", doc.data());
            });
          })
          .catch(function (error) {
            console.log("Error getting documents: ", error);
          });
      // [END get_multiple]
    }).timeout(5000);

    it("should get all documents from a collection", () => {
      return output =
        // [START get_multiple_all]
        db.collection("cities").get().then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            // doc.data() is never undefined for query doc snapshots
            console.log(doc.id, " => ", doc.data());
          });
        });
      // [END get_multiple_all]
    })

    it("should listen on multiple documents #UNVERIFIED", (done) => {
      var unsubscribe =
        // [START listen_multiple]
        db.collection("cities").where("state", "==", "CA")
          .onSnapshot(function (querySnapshot) {
            var cities = [];
            querySnapshot.forEach(function (doc) {
              cities.push(doc.data().name);
            });
            console.log("Current cities in CA: ", cities.join(", "));
          });
      // [END listen_multiple]
      setTimeout(function () {
        unsubscribe();
        done();
      }, 2500);
    }).timeout(5000);

    it("should view changes between snapshots #UNVERIFIED", (done) => {
      var unsubscribe =
        // [START listen_diffs]
        db.collection("cities").where("state", "==", "CA")
          .onSnapshot(function (snapshot) {
            snapshot.docChanges().forEach(function (change) {
              if (change.type === "added") {
                console.log("New city: ", change.doc.data());
              }
              if (change.type === "modified") {
                console.log("Modified city: ", change.doc.data());
              }
              if (change.type === "removed") {
                console.log("Removed city: ", change.doc.data());
              }
            });
          });
      // [END listen_diffs]
      setTimeout(function () {
        unsubscribe();
        done();
      }, 2500);
    }).timeout(5000);

    it("should unsubscribe a listener", () => {
      // [START detach_listener]
      var unsubscribe = db.collection("cities")
        .onSnapshot(function () {
          // Respond to data
          // ...
        });

      // Later ...

      // Stop listening to changes
      unsubscribe();
      // [END detach_listener]
    });

    it("should handle listener errors", () => {
      var unsubscribe =
        // [START handle_listen_errors]
        db.collection("cities")
          .onSnapshot(function (snapshot) {
            //...
          }, function (error) {
            //...
          });
      // [END handle_listen_errors]
      unsubscribe();
    });

    it("should update a document with server timestamp", () => {
      function update() {
        // [START update_with_server_timestamp]
        var docRef = db.collection('objects').doc('some-id');

        // Update the timestamp field with the value from the server
        var updateTimestamp = docRef.update({
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        // [END update_with_server_timestamp]

        return updateTimestamp;
      }

      return db.collection('objects').doc('some-id')
        .set({})
        .then(() => update())
        .then(() => {
          console.log('Document updated with server timestamp');
        });
    });

    it("should use options to control server timestamp resolution #UNVERIFIED", () => {
      var options = {
        // Options: 'estimate', 'previous', or 'none'
        serverTimestamps: 'estimate'
      };

      // Perform an update followed by an immediate read without
      // waiting for the update to complete. Due to the snapshot
      // options we will get two results: one with an estimate
      // timestamp and one with the resolved server timestamp.
      var docRef = db.collection('objects').doc('some-id');
      docRef.update({
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      docRef.onSnapshot(function (snapshot) {
        var data = snapshot.data(options);
        console.log(
          'Timestamp: ' + data.timestamp +
          ', pending: ' + snapshot.metadata.hasPendingWrites);
      });
    });

    it("should delete a document field", () => {
      function update() {
        // [START update_delete_field]
        var cityRef = db.collection('cities').doc('BJ');

        // Remove the 'capital' field from the document
        var removeCapital = cityRef.update({
          capital: firebase.firestore.FieldValue.delete()
        });
        // [END update_delete_field]

        return removeCapital;
      }


      return db.collection('cities').doc('BJ')
        .set({ capital: true })
        .then(() => update())
        .then(() => {
          console.log('Document field deleted');
        });
    });
  });
});
