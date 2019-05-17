/**
 * Copyright 2018-2019, Optimizely
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from 'react'
import * as Enzyme from 'enzyme'
import * as Adapter from 'enzyme-adapter-react-16'
Enzyme.configure({ adapter: new Adapter() })

import { mount } from 'enzyme'
import { OptimizelyProvider } from './Provider'
import { ReactSDKClient } from './client'
import { OptimizelyFeature } from './Feature'

async function sleep(timeout = 0): Promise<{}> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, timeout)
  })
}

describe('<OptimizelyFeature>', () => {
  it('throws an error when not rendered in the context of an OptimizelyProvider', () => {
    expect(() => {
      // @ts-ignore
      mount(
        <OptimizelyFeature feature="feature1">
          {(isEnabled, variables) => isEnabled}
        </OptimizelyFeature>,
      )
    }).toThrow()
  })

  describe('when the isServerSide prop is false', () => {
    it('should wait until onReady() is resolved then render result of isFeatureEnabled and getFeatureVariables', async () => {
      let resolver: any
      const isEnabled = true
      const variables = {
        foo: 'bar',
      }
      const onReadyPromise = new Promise((resolve, reject) => {
        resolver = {
          reject,
          resolve,
        }
      })

      const optimizelyMock = ({
        onReady: jest.fn().mockImplementation(config => onReadyPromise),
        getFeatureVariables: jest.fn().mockImplementation(config => variables),
        isFeatureEnabled: jest.fn().mockImplementation(config => isEnabled),
        onUserUpdate: jest.fn().mockImplementation(handler => () => {}),
        notificationCenter: {
          addNotificationListener: jest.fn().mockImplementation((type, handler) => {}),
          removeNotificationListener: jest.fn().mockImplementation(id => {}),
        },
      } as unknown) as ReactSDKClient

      const component = mount(
        <OptimizelyProvider optimizely={optimizelyMock}>
          <OptimizelyFeature feature="feature1">
            {(isEnabled, variables) =>
              `${isEnabled ? 'true' : 'false'}|${variables.foo}`
            }
          </OptimizelyFeature>
        </OptimizelyProvider>,
      )

      expect(optimizelyMock.onReady).toHaveBeenCalledWith({ timeout: undefined })

      // while it's waiting for onReady()
      expect(component.text()).toBe(null)
      resolver.resolve()

      await sleep()

      expect(optimizelyMock.isFeatureEnabled).toHaveBeenCalledWith('feature1')
      expect(optimizelyMock.getFeatureVariables).toHaveBeenCalledWith('feature1')
      expect(component.text()).toBe('true|bar')
    })

    it('should respect the timeout provided in <OptimizelyProvider>', async () => {
      let resolver: any
      const isEnabled = true
      const variables = {
        foo: 'bar',
      }
      const onReadyPromise = new Promise((resolve, reject) => {
        resolver = {
          reject,
          resolve,
        }
      })

      const optimizelyMock = ({
        onReady: jest.fn().mockImplementation(config => onReadyPromise),
        getFeatureVariables: jest.fn().mockImplementation(config => variables),
        isFeatureEnabled: jest.fn().mockImplementation(config => isEnabled),
        onUserUpdate: jest.fn().mockImplementation(handler => () => {}),
        notificationCenter: {
          addNotificationListener: jest.fn().mockImplementation((type, handler) => {}),
          removeNotificationListener: jest.fn().mockImplementation(id => {}),
        },
      } as unknown) as ReactSDKClient

      const component = mount(
        <OptimizelyProvider optimizely={optimizelyMock} timeout={200}>
          <OptimizelyFeature feature="feature1">
            {(isEnabled, variables) =>
              `${isEnabled ? 'true' : 'false'}|${variables.foo}`
            }
          </OptimizelyFeature>
        </OptimizelyProvider>,
      )

      expect(optimizelyMock.onReady).toHaveBeenCalledWith({ timeout: 200 })

      // while it's waiting for onReady()
      expect(component.text()).toBe(null)
      resolver.resolve()

      await sleep()

      expect(optimizelyMock.isFeatureEnabled).toHaveBeenCalledWith('feature1')
      expect(optimizelyMock.getFeatureVariables).toHaveBeenCalledWith('feature1')
      expect(component.text()).toBe('true|bar')
    })
  })

  describe('when the isServerSide prop is true', () => {
    it('should immediately render the result of isFeatureEnabled and getFeatureVariables', async () => {
      const isEnabled = true
      const variables = {
        foo: 'bar',
      }
      const onReadyPromise = new Promise((resolve, reject) => {})
      const optimizelyMock = ({
        onReady: jest.fn().mockImplementation(config => onReadyPromise),
        getFeatureVariables: jest.fn().mockImplementation(config => variables),
        isFeatureEnabled: jest.fn().mockImplementation(config => isEnabled),
      } as unknown) as ReactSDKClient

      const component = mount(
        <OptimizelyProvider optimizely={optimizelyMock} isServerSide={true}>
          <OptimizelyFeature feature="feature1">
            {(isEnabled, variables) =>
              `${isEnabled ? 'true' : 'false'}|${variables.foo}`
            }
          </OptimizelyFeature>
        </OptimizelyProvider>,
      )

      expect(component.text()).toBe('true|bar')
    })
  })
})
