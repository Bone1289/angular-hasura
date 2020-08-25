import {Component, OnInit} from '@angular/core';
import gql from 'graphql-tag';
import {Observable} from "rxjs";
import {Apollo, QueryRef} from "apollo-angular";
import {map} from "rxjs/operators";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";

interface Task {
  uuid: string;
  title: string;
  description: string;
  user: User
}

interface User {
  uuid: string;
  displayName: string;
}

interface Response {
  tasks: Task[];
}

const GET_TASK = gql`
query Task {
  tasks {
    user {
      fullName
      uuid
    }
    title
    description
    uuid
  }
}
`;

const ADD_TASK = gql`
mutation AddTask($authorId: uuid!, $description:String!, $title:name!) {
  insert_tasks(objects: {description: $description, title: $title authorId: $authorId}) {
    returning {
      title
      description
      user {
        fullName
        uuid
      }
      uuid
    }
  }
}
`;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'hasura-tutorial';

  tasks: Observable<Task[]>;
  form: FormGroup;

  queryRef: QueryRef<Response>;

  constructor(private apollo: Apollo, private fb: FormBuilder) {
  }

  onAddTask() {
    this.apollo.mutate({
      mutation: ADD_TASK,
      variables: this.form.value
    }).subscribe(({data}) => {
      this.form.controls.title.reset('');
      this.form.controls.description.reset('');
      this.queryRef.refetch();
    }, error => {
      console.log("Error:", error);
    })
  }

  ngOnInit() {
    this.form = this.fb.group({
      title: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
      authorId: new FormControl(
        '8a812098-ba3c-45b8-9f67-f99823f85f0f',
        Validators.required
      )
    })

    this.queryRef = this.apollo.watchQuery<Response>({
      query: GET_TASK
    });
    this.tasks = this.queryRef.valueChanges.pipe(map((result) => result.data.tasks));
  }
}
